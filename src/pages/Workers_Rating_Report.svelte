<script>
    import TitleBar from "../TitleBar.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    // import { DateTime } from "luxon";
    import { onMount } from "svelte";
    import { pop } from "svelte-spa-router";

    export const params = {};   

    let selectedBranch = "";
    let selectedDate = DateTime.local().setLocale("es-mx").toISODate();
    let workersData = [];
    let branchName = "";
    let loading = false;
    let groups = [];
    let cleaningPositions = [];

    onMount(() => {
        // Auto-seleccionar fecha actual
        selectedDate = DateTime.local().setLocale("es-mx").toISODate();
    });

    $: if (selectedBranch && selectedDate) {
        loadWorkersResponsibilities();
    }

    async function loadWorkersResponsibilities() {
        if (!selectedBranch || !selectedDate) return;
        
        loading = true;
        workersData = [];
        
        try {
            // Obtener información de la estancia
            const branchDoc = await db.collection("branches").doc(selectedBranch).get();
            if (branchDoc.exists) {
                const branchData = branchDoc.data();
                branchName = branchData.name;
                
                // Cargar grupos de la estancia
                groups = [];
                if (branchData.groups != undefined && branchData.groups > 0) {
                    for (let index = 1; index <= branchData.groups; index++) {
                        groups.push({name: "Grupo " + index, uid: index});
                    }
                }
            }

            // Cargar puestos de limpieza
            await loadCleaningPositions();

            // Obtener asignaciones del día seleccionado
            const assignmentsSnapshot = await db.collection("patient_user")
                .where("branch", "==", selectedBranch)
                .where("dayId", "==", selectedDate)
                .get();

            console.log("🔍 Asignaciones encontradas:", assignmentsSnapshot.size);

            const workerAssignments = {};
            const processedWorkers = new Set();

            assignmentsSnapshot.forEach((doc) => {
                const data = doc.data();
                
                console.log("📄 Documento raw:", doc.id, data);
                console.log("📄 Campos disponibles:", Object.keys(data));
                console.log("📄 data.user:", data.user);
                console.log("📄 data.workers:", data.workers);
                console.log("📄 data.group:", data.group);
                
                // Determinar qué campo usar para el ID del trabajador
                let workerId = data.user || data.workers;
                
                // Validar que tenemos los datos mínimos necesarios
                if (!workerId || data.group === undefined || data.group === null) {
                    console.warn("⚠️ Documento sin datos válidos:", doc.id, data);
                    return;
                }

                const shift = data.shift ? "day" : "night";
                const group = data.group;

                console.log("📄 Procesando asignación:", {
                    workerId,
                    shift,
                    group,
                    groupType: typeof group,
                    docId: doc.id,
                    userName: data.userName
                });

                if (!workerAssignments[workerId]) {
                    workerAssignments[workerId] = {
                        workerId: workerId,
                        assignments: [],
                        dayShifts: [],
                        nightShifts: []
                    };
                }

                // Determinar el tipo de responsabilidad con manejo de errores
                let responsibilityType = "";
                let responsibilityName = "";

                try {
                    // Asegurar que group sea tratado como string
                    const groupStr = group ? String(group) : "";

                    console.log("🔍 Analizando grupo:", {
                        group,
                        groupStr,
                        groupType: typeof group
                    });

                    if (groupStr && groupStr.startsWith("limpieza-")) {
                        responsibilityType = "limpieza";
                        const positionId = groupStr.replace("limpieza-", "");
                        const position = cleaningPositions.find(p => p.id === positionId);
                        responsibilityName = position ? position.name : "Limpieza";
                    } else if (groupStr === "limpieza") {
                        responsibilityType = "limpieza";
                        responsibilityName = "Limpieza General";
                    } else if (groupStr && !isNaN(Number(groupStr))) {
                        // Es un número (grupo de pacientes)
                        responsibilityType = "grupo";
                        const groupObj = groups.find(g => g.uid == Number(groupStr));
                        responsibilityName = groupObj ? groupObj.name : `Grupo ${groupStr}`;
                    } else {
                        // Cualquier otro caso
                        responsibilityType = "grupo";
                        const groupObj = groups.find(g => g.uid == group || g.uid == groupStr);
                        responsibilityName = groupObj ? groupObj.name : `Grupo ${groupStr}`;
                    }
                } catch (error) {
                    console.error("Error procesando grupo:", error, { group, workerId, shift });
                    responsibilityType = "grupo";
                    responsibilityName = `Grupo ${group}`;
                }

                const assignment = {
                    group: group,
                    shift: shift,
                    type: responsibilityType,
                    name: responsibilityName,
                    shiftText: shift === "day" ? "Día" : "Noche"
                };

                console.log("✅ Asignación creada:", assignment);

                workerAssignments[workerId].assignments.push(assignment);
                
                if (shift === "day") {
                    workerAssignments[workerId].dayShifts.push(assignment);
                } else {
                    workerAssignments[workerId].nightShifts.push(assignment);
                }
            });

            // Convertir a array y cargar información de trabajadores
            const workerIds = Object.keys(workerAssignments);
            console.log("👥 Trabajadores únicos encontrados:", workerIds.length);

            for (const workerId of workerIds) {
                try {
                    const workerDoc = await db.collection("workers").doc(workerId).get();
                    if (workerDoc.exists) {
                        const workerData = workerDoc.data();
                        
                        const workerInfo = {
                            id: workerId,
                            name: workerData.name || "Sin nombre",
                            assignments: workerAssignments[workerId].assignments,
                            dayShifts: workerAssignments[workerId].dayShifts,
                            nightShifts: workerAssignments[workerId].nightShifts,
                            totalAssignments: workerAssignments[workerId].assignments.length,
                            // Estadísticas de actividades
                            dayActivities: {
                                total: 0,
                                rating100: 0,
                                rating50: 0,
                                rating0: 0,
                                average: 0
                            },
                            nightActivities: {
                                total: 0,
                                rating100: 0,
                                rating50: 0,
                                rating0: 0,
                                average: 0
                            }
                        };

                        // Cargar y calcular actividades con calificaciones
                        await loadWorkerActivities(workerInfo);
                        
                        console.log("👤 Trabajador final:", {
                            name: workerInfo.name,
                            assignments: workerInfo.assignments,
                            dayShifts: workerInfo.dayShifts,
                            nightShifts: workerInfo.nightShifts
                        });
                        
                        workersData.push(workerInfo);
                    }
                } catch (error) {
                    console.error(`Error cargando trabajador ${workerId}:`, error);
                }
            }

            workersData.sort((a, b) => a.name.localeCompare(b.name));
            console.log("📊 Datos finales de trabajadores:", workersData);

        } catch (error) {
            console.error("Error cargando responsabilidades:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar las responsabilidades de los trabajadores."
            });
        } finally {
            loading = false;
        }
    }

    async function loadCleaningPositions() {
        try {
            const cleaningRoles = await db.collection("workroles")
                .where("branches", "==", selectedBranch)
                .get();
            
            const positionIds = [];
            cleaningRoles.forEach((roleDoc) => {
                const roleData = roleDoc.data();
                if (roleData.positions) {
                    positionIds.push(roleData.positions);
                }
            });

            cleaningPositions = [];
            for (const positionId of positionIds) {
                try {
                    const positionDoc = await db.collection("positions").doc(positionId).get();
                    if (positionDoc.exists) {
                        const positionData = positionDoc.data();
                        const positionName = positionData.name.toLowerCase();
                        
                        if (positionName.includes('limpieza') || 
                            positionName.includes('aseo') || 
                            positionName.includes('intendencia') || 
                            positionName.includes('mantenimiento')) {
                            cleaningPositions.push({
                                id: positionId,
                                name: positionData.name,
                                data: positionData
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error consultando posición ${positionId}:`, error);
                }
            }
        } catch (error) {
            console.error("Error cargando puestos de limpieza:", error);
        }
    }

    async function loadWorkerActivities(workerInfo) {
        try {
            console.log(`🎯 Cargando actividades para trabajador: ${workerInfo.name} (${workerInfo.id})`);
            
            const dayActivities = [];
            const nightActivities = [];

            // Procesar cada asignación para determinar qué actividades cargar
            for (const assignment of workerInfo.assignments) {
                if (assignment.type === "limpieza") {
                    // Para limpieza, buscar actividades del paciente "limpieza"
                    console.log(`🧹 Cargando actividades de limpieza para: ${assignment.name}`);
                    const activitiesQuery = db.collection("cardActivities")
                        .where("branch", "==", selectedBranch)
                        .where("dayId", "==", selectedDate)
                        .where("patient", "==", "limpieza");

                    const activitiesSnapshot = await activitiesQuery.get();
                    console.log(`📋 Actividades de limpieza encontradas:`, activitiesSnapshot.size);
                    
                    activitiesSnapshot.forEach((doc) => {
                        const activity = doc.data();
                        activity.id = doc.id;
                        const rating = calculateActivityRating(activity);
                        activity.rating = rating;
                        activity.assignmentType = assignment.type;
                        activity.assignmentName = assignment.name;
                        
                        if (assignment.shift === "day") {
                            dayActivities.push(activity);
                        } else if (assignment.shift === "night") {
                            nightActivities.push(activity);
                        }
                    });
                } else {
                    // Para grupos normales, buscar pacientes asignados al número del grupo
                    console.log(`👥 Cargando actividades de grupo: ${assignment.name} (grupo: ${assignment.group})`);
                    
                    // 1. Buscar pacientes activos que tienen workers igual al número del grupo
                    const patientsQuery = db.collection("patients")
                        .where("branch", "==", selectedBranch)
                        .where("workers", "==", assignment.group);
                    
                    const patientsSnapshot = await patientsQuery.get();
                    console.log(`👤 Pacientes encontrados con workers=${assignment.group}:`, patientsSnapshot.size);
                    
                    if (patientsSnapshot.size > 0) {
                        const patientIds = [];
                        patientsSnapshot.forEach(doc => {
                            const patientData = doc.data();
                            // Solo incluir pacientes activos (status = 0 o undefined)
                            if (patientData.status === undefined || patientData.status === 0) {
                                patientIds.push(doc.id);
                                console.log(`✅ Paciente activo: ${doc.id} - ${patientData.name} (workers: ${patientData.workers})`);
                            }
                        });
                        
                        console.log(`📋 IDs de pacientes activos a buscar:`, patientIds);
                        
                        // 2. Buscar actividades de esos pacientes en lotes de 10 (límite de Firebase para 'in')
                        if (patientIds.length > 0) {
                            for (let i = 0; i < patientIds.length; i += 10) {
                                const batch = patientIds.slice(i, i + 10);
                                
                                const activitiesQuery = db.collection("cardActivities")
                                    .where("branch", "==", selectedBranch)
                                    .where("dayId", "==", selectedDate)
                                    .where("patient", "in", batch);
                                
                                const activitiesSnapshot = await activitiesQuery.get();
                                console.log(`📋 Actividades encontradas para lote ${Math.floor(i/10) + 1}:`, activitiesSnapshot.size);
                                
                                activitiesSnapshot.forEach((doc) => {
                                    const activity = doc.data();
                                    activity.id = doc.id;
                                    const rating = calculateActivityRating(activity);
                                    activity.rating = rating;
                                    activity.assignmentType = assignment.type;
                                    activity.assignmentName = assignment.name;
                                    
                                    console.log(`📊 Actividad: ${activity.name}, Paciente: ${activity.patient}, Marcada: ${activity.checkActivity}, Rating: ${rating}`);
                                    
                                    // Separar por turnos según la asignación del trabajador
                                    if (assignment.shift === "day") {
                                        dayActivities.push(activity);
                                    } else if (assignment.shift === "night") {
                                        nightActivities.push(activity);
                                    }
                                });
                            }
                        } else {
                            console.log(`⚠️ No se encontraron pacientes activos con workers=${assignment.group}`);
                        }
                    } else {
                        console.log(`⚠️ No se encontraron pacientes con workers=${assignment.group}`);
                    }
                }
            }

            console.log(`📈 Actividades procesadas para ${workerInfo.name}:`, {
                dayTotal: dayActivities.length,
                nightTotal: nightActivities.length
            });

            // Calcular estadísticas para turno diurno
            if (workerInfo.dayShifts.length > 0) {
                calculateActivityStats(dayActivities, workerInfo.dayActivities);
            }

            // Calcular estadísticas para turno nocturno
            if (workerInfo.nightShifts.length > 0) {
                calculateActivityStats(nightActivities, workerInfo.nightActivities);
            }

            console.log(`📈 Estadísticas finales para ${workerInfo.name}:`, {
                day: workerInfo.dayActivities,
                night: workerInfo.nightActivities
            });

        } catch (error) {
            console.error("Error cargando actividades del trabajador:", error);
        }
    }

    function calculateActivityStats(activities, statsObject) {
        statsObject.total = activities.length;
        statsObject.rating100 = activities.filter(a => a.rating === 100).length;
        statsObject.rating50 = activities.filter(a => a.rating === 50).length;
        statsObject.rating0 = activities.filter(a => a.rating === 0).length;
        
        // Calcular promedio
        if (statsObject.total > 0) {
            const totalScore = (statsObject.rating100 * 100) + (statsObject.rating50 * 50) + (statsObject.rating0 * 0);
            statsObject.average = Math.round(totalScore / statsObject.total);
        } else {
            statsObject.average = 0;
        }
    }

    function calculateActivityRating(activity) {
        // Si no está marcada como completada, calificación 0
        if (!activity.checkActivity) {
            console.log('Activity not checked:', activity.name);
            return 0;
        }
        
        if (!activity.time || !activity.checkDate) {
            console.log('Missing time or checkDate:', activity.name, activity.time, activity.checkDate);
            return 100; // Si no hay tiempos definidos, asumir 100%
        }
        
        // Parsear tiempo programado de la actividad (ej: "12:00")
        const activityTime = parseActivityTime(activity.time, activity.dayId);
        // Parsear tiempo cuando se marcó como completada (timestamp de Firebase)
        const checkTime = activity.checkDate.toDate();
        
        if (!activityTime || !checkTime) {
            console.log('Could not parse times:', activity.name, activityTime, checkTime);
            return 100;
        }
        
        // Calcular diferencia en minutos (checkTime - activityTime)
        const diffMinutes = (checkTime.getTime() - activityTime.getTime()) / (1000 * 60);
        
        let rating;
        
        // Las actividades pueden empezarse a marcar 30 minutos antes
        if (diffMinutes < -30) {
            rating = 0; // Muy temprano (más de 30 min antes)
        }
        // Dentro de la primera hora (desde 30 min antes hasta 60 min después): 100%
        else if (diffMinutes <= 60) {
            rating = 100;
        }
        // Entre 1 y 2 horas después: 50%
        else if (diffMinutes <= 120) {
            rating = 50;
        }
        // Más de 2 horas después: 0%
        else {
            rating = 0;
        }
        
        return rating;
    }

    function parseActivityTime(timeString, dayId) {
        if (!timeString || !dayId) {
            return null;
        }
        
        try {
            // timeString es como "12:00", dayId es como "2025-08-03"
            const fullDate = new Date(dayId + 'T' + timeString + ':00');
            return fullDate;
        } catch (e) {
            console.error('Error parsing activity time:', timeString, dayId, e);
            return null;
        }
    }

    function getRatingColor(rating) {
        switch(rating) {
            case 100: return "success";
            case 50: return "warning";
            case 0: return "danger";
            default: return "secondary";
        }
    }

    function getRatingBadgeClass(rating) {
        switch(rating) {
            case 100: return "badge-success";
            case 50: return "badge-warning";
            case 0: return "badge-danger";
            default: return "badge-secondary";
        }
    }
</script>

<div class="page-content">
    <TitleBar title="Calificación de Responsables de Actividades" base="Supervisión" />
    
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <label for="branch" class="form-label">Estancia</label>
                            <BranchesSearchList bind:value={selectedBranch} inlist={false} />
                        </div>
                        <div class="col-md-4">
                            <label for="date" class="form-label">Fecha</label>
                            <input 
                                type="date" 
                                class="form-control" 
                                bind:value={selectedDate}
                            />
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-secondary" on:click={() => pop()}>
                                <i class="bx bx-arrow-back"></i> Regresar
                            </button>
                        </div>
                    </div>

                    {#if selectedBranch && selectedDate}
                        <div class="row mb-3">
                            <div class="col-12">
                                <h4>
                                    {branchName} - {selectedDate}
                                </h4>
                            </div>
                        </div>

                        <!-- Panel de información sobre el sistema de calificaciones -->
                        <div class="row mb-4">
                            <div class="col-12">
                                <div class="rating-info-panel">
                                    <div class="info-header">
                                        <div class="info-icon">
                                            <i class="bx bx-info-circle"></i>
                                        </div>
                                        <div class="info-title">
                                            <h5>Sistema de Calificación de Actividades</h5>
                                            <p>Cómo se evalúa el desempeño de los trabajadores</p>
                                        </div>
                                        <button class="info-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#ratingExplanation" aria-expanded="false">
                                            <i class="bx bx-chevron-down"></i>
                                        </button>
                                    </div>
                                    
                                    <div class="collapse" id="ratingExplanation">
                                        <div class="info-content">
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="explanation-section">
                                                        <h6><i class="bx bx-time-five"></i> Criterios de Puntuación</h6>
                                                        <div class="criteria-list">
                                                            <div class="criteria-item excellent">
                                                                <div class="criteria-score">100 pts</div>
                                                                <div class="criteria-desc">
                                                                    <strong>Excelente:</strong> Actividad realizada desde 30 minutos antes hasta 1 hora después de la hora programada.
                                                                </div>
                                                            </div>
                                                            <div class="criteria-item regular">
                                                                <div class="criteria-score">50 pts</div>
                                                                <div class="criteria-desc">
                                                                    <strong>Regular:</strong> Actividad realizada entre 1 y 2 horas después de la hora programada.
                                                                </div>
                                                            </div>
                                                            <div class="criteria-item bad">
                                                                <div class="criteria-score">0 pts</div>
                                                                <div class="criteria-desc">
                                                                    <strong>Malo:</strong> Actividad no realizada, realizada más de 30 minutos antes, o más de 2 horas después.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="explanation-section">
                                                        <h6><i class="bx bx-calculator"></i> Cálculo del Promedio</h6>
                                                        <div class="calculation-formula">
                                                            <div class="formula-box">
                                                                <div class="formula-title">Fórmula:</div>
                                                                <div class="formula-text">
                                                                    Promedio = (Actividades×100pts + Actividades×50pts + Actividades×0pts) ÷ Total de Actividades
                                                                </div>
                                                            </div>
                                                            <div class="example-box">
                                                                <div class="example-title">Ejemplo:</div>
                                                                <div class="example-calc">
                                                                    <div>16 actividades × 100pts = 1,600pts</div>
                                                                    <div>12 actividades × 50pts = 600pts</div>
                                                                    <div>52 actividades × 0pts = 0pts</div>
                                                                    <hr>
                                                                    <div><strong>Total: 2,200pts ÷ 80 actividades = 28pts promedio</strong></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mt-3">
                                                <div class="col-12">
                                                    <div class="explanation-section">
                                                        <h6><i class="bx bx-group"></i> Asignación de Responsabilidades</h6>
                                                        <p class="explanation-text">
                                                            Los trabajadores son evaluados según las actividades de los <strong>pacientes asignados a su grupo</strong> y las <strong>tareas de limpieza</strong> 
                                                            que tienen programadas para su turno (día/noche). El sistema busca automáticamente todas las actividades 
                                                            correspondientes y calcula su desempeño basado en la puntualidad de ejecución.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {#if loading}
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="sr-only">Cargando...</span>
                                </div>
                                <p class="mt-2">Cargando responsabilidades de trabajadores...</p>
                            </div>
                        {:else if workersData.length === 0}
                            <div class="alert alert-info text-center">
                                <i class="bx bx-info-circle fs-4"></i>
                                <h5 class="mt-2">No hay trabajadores asignados</h5>
                                <p>No se encontraron trabajadores con responsabilidades asignadas para esta fecha en la estancia seleccionada.</p>
                            </div>
                        {:else}
                            <div class="row">
                                {#each workersData as worker}
                                    <div class="col-lg-6 col-xl-4 mb-4">
                                        <div class="worker-card">
                                            <!-- Header del trabajador -->
                                            <div class="worker-card-header">
                                                <div class="worker-avatar">
                                                    <i class="bx bx-user"></i>
                                                </div>
                                                <div class="worker-info">
                                                    <h5 class="worker-name">{worker.name}</h5>
                                                    <div class="worker-assignments-count">
                                                        <i class="bx bx-briefcase"></i>
                                                        {worker.totalAssignments} {worker.totalAssignments === 1 ? 'responsabilidad' : 'responsabilidades'}
                                                    </div>
                                                </div>
                                                <div class="worker-status">
                                                    <div class="status-indicator status-active"></div>
                                                </div>
                                            </div>

                                            <!-- Cuerpo de la tarjeta -->
                                            <div class="worker-card-body">
                                                <!-- Responsabilidades -->
                                                <div class="responsibilities-section">
                                                    <div class="section-title">
                                                        <i class="bx bx-target-lock"></i>
                                                        Responsabilidades asignadas
                                                    </div>
                                                    <div class="responsibilities-grid">
                                                        {#each worker.assignments as assignment}
                                                            <div class="responsibility-chip {assignment.type === 'limpieza' ? 'chip-cleaning' : 'chip-group'}">
                                                                <span>{assignment.name}</span>
                                                                <span class="chip-shift">({assignment.shiftText})</span>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </div>

                                                <!-- Estadísticas de Actividades Diurnas -->
                                                {#if worker.dayShifts.length > 0}
                                                    <div class="stats-section">
                                                        <div class="stats-header">
                                                            <div class="stats-icon day-icon">
                                                                <i class="bx bx-sun"></i>
                                                            </div>
                                                            <h6 class="stats-title">Turno Diurno</h6>
                                                            <div class="stats-total">{worker.dayActivities.total}</div>
                                                        </div>
                                                        
                                                        <!-- Grid de rendimiento -->
                                                        <div class="performance-grid">
                                                            <div class="performance-item excellent">
                                                                <div class="perf-number">{worker.dayActivities.rating100}</div>
                                                                <div class="perf-label">Excelente</div>
                                                                <div class="perf-points">100pts</div>
                                                            </div>
                                                            <div class="performance-item regular">
                                                                <div class="perf-number">{worker.dayActivities.rating50}</div>
                                                                <div class="perf-label">Regular</div>
                                                                <div class="perf-points">50pts</div>
                                                            </div>
                                                            <div class="performance-item very-bad">
                                                                <div class="perf-number">{worker.dayActivities.rating0}</div>
                                                                <div class="perf-label">Malo</div>
                                                                <div class="perf-points">0pts</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <!-- Promedio -->
                                                        {#if worker.dayActivities.total > 0}
                                                            <div class="average-score {getRatingColor(worker.dayActivities.average)}">
                                                                <div class="average-number">{worker.dayActivities.average}</div>
                                                                <div class="average-label">Promedio</div>
                                                            </div>
                                                        {:else}
                                                            <div class="no-activities">
                                                                <i class="bx bx-info-circle"></i>
                                                                Sin actividades asignadas
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}

                                                <!-- Estadísticas de Actividades Nocturnas -->
                                                {#if worker.nightShifts.length > 0}
                                                    <div class="stats-section">
                                                        <div class="stats-header">
                                                            <div class="stats-icon night-icon">
                                                                <i class="bx bx-moon"></i>
                                                            </div>
                                                            <h6 class="stats-title">Turno Nocturno</h6>
                                                            <div class="stats-total">{worker.nightActivities.total}</div>
                                                        </div>
                                                        
                                                        <!-- Grid de rendimiento -->
                                                        <div class="performance-grid">
                                                            <div class="performance-item excellent">
                                                                <div class="perf-number">{worker.nightActivities.rating100}</div>
                                                                <div class="perf-label">Excelente</div>
                                                                <div class="perf-points">100pts</div>
                                                            </div>
                                                            <div class="performance-item regular">
                                                                <div class="perf-number">{worker.nightActivities.rating50}</div>
                                                                <div class="perf-label">Regular</div>
                                                                <div class="perf-points">50pts</div>
                                                            </div>
                                                            <div class="performance-item very-bad">
                                                                <div class="perf-number">{worker.nightActivities.rating0}</div>
                                                                <div class="perf-label">Malo</div>
                                                                <div class="perf-points">0pts</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <!-- Promedio -->
                                                        {#if worker.nightActivities.total > 0}
                                                            <div class="average-score {getRatingColor(worker.nightActivities.average)}">
                                                                <div class="average-number">{worker.nightActivities.average}</div>
                                                                <div class="average-label">Promedio</div>
                                                            </div>
                                                        {:else}
                                                            <div class="no-activities">
                                                                <i class="bx bx-info-circle"></i>
                                                                Sin actividades asignadas
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    {:else}
                        <div class="alert alert-warning text-center">
                            <i class="bx bx-info-circle fs-4"></i>
                            <h5 class="mt-2">Selecciona estancia y fecha</h5>
                            <p>Selecciona una estancia y fecha para ver los trabajadores responsables y poder calificarlos.</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* ========== DISEÑO ELEGANTE PARA TARJETAS DE TRABAJADORES ========== */
    
    /* Panel de información sobre calificaciones */
    .rating-info-panel {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 16px;
        border: 1px solid #cbd5e1;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    .info-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        cursor: pointer;
    }
    
    .info-icon {
        width: 50px;
        height: 50px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .info-title {
        flex: 1;
    }
    
    .info-title h5 {
        margin: 0;
        font-weight: 600;
        font-size: 1.1rem;
    }
    
    .info-title p {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9rem;
    }
    
    .info-toggle {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s ease;
    }
    
    .info-toggle:hover {
        background: rgba(255,255,255,0.1);
    }
    
    .info-content {
        padding: 1.5rem;
        background: white;
    }
    
    .explanation-section {
        margin-bottom: 1.5rem;
    }
    
    .explanation-section h6 {
        color: #374151;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .explanation-section h6 i {
        color: #3b82f6;
    }
    
    .criteria-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .criteria-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        border-radius: 12px;
        border-left: 4px solid;
    }
    
    .criteria-item.excellent {
        background: #f0fdf4;
        border-left-color: #10b981;
    }
    
    .criteria-item.regular {
        background: #fffbeb;
        border-left-color: #f59e0b;
    }
    
    .criteria-item.bad {
        background: #f9fafb;
        border-left-color: #6b7280;
    }
    
    .criteria-score {
        font-weight: 700;
        font-size: 1.1rem;
        min-width: 60px;
        text-align: center;
        padding: 0.25rem 0.5rem;
        border-radius: 8px;
        color: white;
    }
    
    .criteria-item.excellent .criteria-score {
        background: #10b981;
    }
    
    .criteria-item.regular .criteria-score {
        background: #f59e0b;
    }
    
    .criteria-item.bad .criteria-score {
        background: #6b7280;
    }
    
    .criteria-desc {
        flex: 1;
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .calculation-formula {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .formula-box, .example-box {
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
    }
    
    .formula-box {
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        border-color: #3b82f6;
    }
    
    .example-box {
        background: #f8fafc;
    }
    
    .formula-title, .example-title {
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }
    
    .formula-text {
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        color: #1e40af;
        background: rgba(255,255,255,0.8);
        padding: 0.5rem;
        border-radius: 6px;
    }
    
    .example-calc {
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        color: #374151;
    }
    
    .example-calc div {
        margin-bottom: 0.25rem;
    }
    
    .example-calc hr {
        margin: 0.5rem 0;
        border-color: #d1d5db;
    }
    
    .explanation-text {
        color: #6b7280;
        line-height: 1.6;
        margin: 0;
    }
    
    /* Tarjeta principal del trabajador */
    .worker-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: all 0.3s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    
    .worker-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }
    
    /* Header del trabajador */
    .worker-card-header {
        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    
    .worker-avatar {
        width: 60px;
        height: 60px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
        border: 2px solid rgba(255,255,255,0.3);
    }
    
    .worker-info {
        flex: 1;
    }
    
    .worker-name {
        color: white;
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    
    .worker-assignments-count {
        color: rgba(255,255,255,0.9);
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }
    
    .worker-assignments-count i {
        margin-right: 0.5rem;
    }
    
    .worker-status {
        display: flex;
        align-items: center;
    }
    
    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
    }
    
    .status-active {
        background: #4ade80;
    }
    
    /* Cuerpo de la tarjeta */
    .worker-card-body {
        background: white;
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    /* Sección de responsabilidades */
    .responsibilities-section {
        margin-bottom: 1rem;
    }
    
    .section-title {
        color: #374151;
        font-size: 0.95rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .section-title i {
        color: #6366f1;
    }
    
    .responsibilities-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .responsibility-chip {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .chip-cleaning {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
    }
    
    .chip-group {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
    }
    
    .chip-shift {
        background: rgba(255,255,255,0.2);
        padding: 0.1rem 0.4rem;
        border-radius: 6px;
        font-size: 0.7rem;
    }
    
    /* Sección de estadísticas */
    .stats-section {
        background: #f8fafc;
        border-radius: 16px;
        padding: 1.25rem;
        border: 1px solid #e2e8f0;
    }
    
    .stats-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .stats-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        color: white;
    }
    
    .day-icon {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
    }
    
    .night-icon {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    }
    
    .stats-title {
        color: #374151;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        flex: 1;
    }
    
    .stats-total {
        background: #667eea;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    /* Grid de rendimiento */
    .performance-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .performance-item {
        text-align: center;
        padding: 0.75rem 0.5rem;
        border-radius: 12px;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }
    
    .performance-item:hover {
        transform: translateY(-2px);
        border-color: currentColor;
    }
    
    .excellent {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }
    
    .regular {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
    }
    
    .very-bad {
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: white;
    }
    
    .perf-number {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }
    
    .perf-label {
        font-size: 0.7rem;
        opacity: 0.9;
        margin-bottom: 0.1rem;
    }
    
    .perf-points {
        font-size: 0.6rem;
        opacity: 0.8;
    }
    
    /* Promedio destacado */
    .average-score {
        text-align: center;
        padding: 1rem;
        border-radius: 16px;
        color: white;
        position: relative;
        overflow: hidden;
    }
    
    .average-score.success {
        background: linear-gradient(135deg, #10b981, #059669);
    }
    
    .average-score.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
    }
    
    .average-score.danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    
    .average-score.secondary {
        background: linear-gradient(135deg, #6b7280, #4b5563);
    }
    
    .average-number {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }
    
    .average-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    /* Sin actividades */
    .no-activities {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
        font-style: italic;
    }
    
    .no-activities i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        display: block;
    }
    
    /* Responsivo */
    @media (max-width: 768px) {
        .performance-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .worker-card-header {
            padding: 1rem;
        }
        
        .worker-card-body {
            padding: 1rem;
        }
        
        .criteria-list {
            gap: 0.5rem;
        }
        
        .criteria-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .criteria-score {
            align-self: flex-start;
        }
        
        .calculation-formula {
            gap: 0.75rem;
        }
        
        .formula-box, .example-box {
            padding: 0.75rem;
        }
    }
</style>
