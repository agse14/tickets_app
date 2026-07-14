<script>
    import TitleBar from "../TitleBar.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    // import { DateTime } from "luxon";
    import { onMount } from "svelte";
    import { pop } from "svelte-spa-router";

    export const params = {};
    
    let selectedBranch = "";
    let startDate = DateTime.local().setLocale("es-mx").minus({days: 7}).toISODate();
    let endDate = DateTime.local().setLocale("es-mx").toISODate();
    let ratingsData = [];
    let branchName = "";
    let loading = false;
    let groupedRatings = {};
    let averagesByWorker = {};
    let groups = [];
    let cleaningPositions = [];

    $: if (selectedBranch && startDate && endDate) {
        loadRatingsHistory();
    }

    async function loadRatingsHistory() {
        if (!selectedBranch || !startDate || !endDate) return;
        
        loading = true;
        ratingsData = [];
        groupedRatings = {};
        averagesByWorker = {};
        
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

            // Generar lista de fechas en el rango
            const dates = [];
            let currentDate = DateTime.fromISO(startDate);
            const endDateTime = DateTime.fromISO(endDate);
            
            while (currentDate <= endDateTime) {
                dates.push(currentDate.toISODate());
                currentDate = currentDate.plus({ days: 1 });
            }

            console.log("🗓️ Procesando fechas:", dates);

            // Procesar cada fecha
            const allWorkersData = [];
            for (const dateStr of dates) {
                const dayWorkers = await loadWorkersForDate(dateStr);
                allWorkersData.push(...dayWorkers);
            }

            console.log("📊 Datos totales de trabajadores:", allWorkersData.length);

            // Procesar datos para el historial
            ratingsData = allWorkersData.map(worker => ({
                workerId: worker.id,
                workerName: worker.name,
                dayId: worker.dayId,
                dateFormatted: DateTime.fromISO(worker.dayId).setLocale("es-mx").toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY),
                shift: worker.shift,
                shiftText: worker.shift === "day" ? "Día" : "Noche",
                rating: worker.averageRating,
                totalActivities: worker.totalActivities,
                assignments: worker.assignments,
                activities: worker.activities,
                stats: worker.stats
            }));

            // Agrupar por trabajador y fecha
            groupedRatings = {};
            ratingsData.forEach(rating => {
                const key = `${rating.workerId}-${rating.dayId}`;
                if (!groupedRatings[key]) {
                    groupedRatings[key] = {
                        workerId: rating.workerId,
                        workerName: rating.workerName,
                        dayId: rating.dayId,
                        dateFormatted: rating.dateFormatted,
                        dayRating: null,
                        nightRating: null,
                        dayStats: null,
                        nightStats: null,
                        dayAssignments: [],
                        nightAssignments: []
                    };
                }

                if (rating.shift === "day") {
                    groupedRatings[key].dayRating = rating.rating;
                    groupedRatings[key].dayStats = rating.stats;
                    groupedRatings[key].dayAssignments = rating.assignments || [];
                } else {
                    groupedRatings[key].nightRating = rating.rating;
                    groupedRatings[key].nightStats = rating.stats;
                    groupedRatings[key].nightAssignments = rating.assignments || [];
                }
            });

            // Calcular promedios por trabajador
            const workerRatings = {};
            ratingsData.forEach(rating => {
                if (!workerRatings[rating.workerId]) {
                    workerRatings[rating.workerId] = {
                        name: rating.workerName,
                        ratings: [],
                        dayRatings: [],
                        nightRatings: []
                    };
                }
                if (rating.rating > 0) { // Solo incluir ratings válidos
                    workerRatings[rating.workerId].ratings.push(rating.rating);
                    if (rating.shift === "day") {
                        workerRatings[rating.workerId].dayRatings.push(rating.rating);
                    } else {
                        workerRatings[rating.workerId].nightRatings.push(rating.rating);
                    }
                }
            });

            // Calcular promedios
            averagesByWorker = {};
            Object.keys(workerRatings).forEach(workerId => {
                const worker = workerRatings[workerId];
                averagesByWorker[workerId] = {
                    name: worker.name,
                    overall: worker.ratings.length > 0 ? Math.round(worker.ratings.reduce((a, b) => a + b, 0) / worker.ratings.length) : 0,
                    day: worker.dayRatings.length > 0 ? Math.round(worker.dayRatings.reduce((a, b) => a + b, 0) / worker.dayRatings.length) : 0,
                    night: worker.nightRatings.length > 0 ? Math.round(worker.nightRatings.reduce((a, b) => a + b, 0) / worker.nightRatings.length) : 0,
                    totalRatings: worker.ratings.length,
                    dayRatings: worker.dayRatings.length,
                    nightRatings: worker.nightRatings.length
                };
            });

            console.log("📊 Calificaciones agrupadas:", groupedRatings);
            console.log("📊 Promedios por trabajador:", averagesByWorker);

        } catch (error) {
            console.error("Error cargando historial de calificaciones:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo cargar el historial de calificaciones."
            });
        } finally {
            loading = false;
        }
    }

    async function loadWorkersForDate(dayId) {
        const workersForDay = [];
        
        try {
            // Obtener asignaciones del día seleccionado
            const assignmentsSnapshot = await db.collection("patient_user")
                .where("branch", "==", selectedBranch)
                .where("dayId", "==", dayId)
                .get();

            console.log(`🔍 Asignaciones encontradas para ${dayId}:`, assignmentsSnapshot.size);

            const workerAssignments = {};

            assignmentsSnapshot.forEach((doc) => {
                const data = doc.data();
                let workerId = data.user || data.workers;
                
                if (!workerId || data.group === undefined || data.group === null) {
                    return;
                }

                const shift = data.shift ? "day" : "night";
                const group = data.group;

                if (!workerAssignments[workerId]) {
                    workerAssignments[workerId] = {
                        workerId: workerId,
                        assignments: [],
                        dayShifts: [],
                        nightShifts: []
                    };
                }

                // Determinar el tipo de responsabilidad
                let responsibilityType = "";
                let responsibilityName = "";

                try {
                    const groupStr = group ? String(group) : "";

                    if (groupStr && groupStr.startsWith("limpieza-")) {
                        responsibilityType = "limpieza";
                        const positionId = groupStr.replace("limpieza-", "");
                        const position = cleaningPositions.find(p => p.id === positionId);
                        responsibilityName = position ? position.name : "Limpieza";
                    } else if (groupStr === "limpieza") {
                        responsibilityType = "limpieza";
                        responsibilityName = "Limpieza General";
                    } else if (groupStr && !isNaN(Number(groupStr))) {
                        responsibilityType = "grupo";
                        const groupObj = groups.find(g => g.uid == Number(groupStr));
                        responsibilityName = groupObj ? groupObj.name : `Grupo ${groupStr}`;
                    } else {
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

                workerAssignments[workerId].assignments.push(assignment);
                
                if (shift === "day") {
                    workerAssignments[workerId].dayShifts.push(assignment);
                } else {
                    workerAssignments[workerId].nightShifts.push(assignment);
                }
            });

            // Procesar cada trabajador
            for (const workerId of Object.keys(workerAssignments)) {
                try {
                    const workerDoc = await db.collection("workers").doc(workerId).get();
                    if (workerDoc.exists) {
                        const workerData = workerDoc.data();
                        
                        // Procesar turnos día y noche por separado
                        const dayShifts = workerAssignments[workerId].dayShifts;
                        const nightShifts = workerAssignments[workerId].nightShifts;
                        
                        if (dayShifts.length > 0) {
                            const dayWorker = await processWorkerShift(workerId, workerData.name, dayShifts, "day", dayId);
                            if (dayWorker) workersForDay.push(dayWorker);
                        }
                        
                        if (nightShifts.length > 0) {
                            const nightWorker = await processWorkerShift(workerId, workerData.name, nightShifts, "night", dayId);
                            if (nightWorker) workersForDay.push(nightWorker);
                        }
                    }
                } catch (error) {
                    console.error(`Error cargando trabajador ${workerId}:`, error);
                }
            }
        } catch (error) {
            console.error(`Error cargando trabajadores para ${dayId}:`, error);
        }
        
        return workersForDay;
    }

    async function processWorkerShift(workerId, workerName, assignments, shift, dayId) {
        try {
            const activities = [];

            // Procesar cada asignación para determinar qué actividades cargar
            for (const assignment of assignments) {
                if (assignment.type === "limpieza") {
                    // Para limpieza, buscar actividades del paciente "limpieza"
                    const activitiesQuery = db.collection("cardActivities")
                        .where("branch", "==", selectedBranch)
                        .where("dayId", "==", dayId)
                        .where("patient", "==", "limpieza");

                    const activitiesSnapshot = await activitiesQuery.get();
                    
                    activitiesSnapshot.forEach((doc) => {
                        const activity = doc.data();
                        activity.id = doc.id;
                        const ratingInfo = calculateActivityRating(activity);
                        activity.ratingInfo = ratingInfo;
                        activity.assignmentType = assignment.type;
                        activity.assignmentName = assignment.name;
                        activities.push(activity);
                    });
                } else {
                    // Para grupos normales, buscar pacientes asignados al número del grupo
                    const patientsQuery = db.collection("patients")
                        .where("branch", "==", selectedBranch)
                        .where("workers", "==", assignment.group);
                    
                    const patientsSnapshot = await patientsQuery.get();
                    
                    if (patientsSnapshot.size > 0) {
                        const patientIds = [];
                        patientsSnapshot.forEach(doc => {
                            const patientData = doc.data();
                            if (patientData.status === undefined || patientData.status === 0) {
                                patientIds.push(doc.id);
                            }
                        });
                        
                        if (patientIds.length > 0) {
                            for (let i = 0; i < patientIds.length; i += 10) {
                                const batch = patientIds.slice(i, i + 10);
                                
                                const activitiesQuery = db.collection("cardActivities")
                                    .where("branch", "==", selectedBranch)
                                    .where("dayId", "==", dayId)
                                    .where("patient", "in", batch);
                                
                                const activitiesSnapshot = await activitiesQuery.get();
                                
                                activitiesSnapshot.forEach((doc) => {
                                    const activity = doc.data();
                                    activity.id = doc.id;
                                    const ratingInfo = calculateActivityRating(activity);
                                    activity.ratingInfo = ratingInfo;
                                    activity.assignmentType = assignment.type;
                                    activity.assignmentName = assignment.name;
                                    activities.push(activity);
                                });
                            }
                        }
                    }
                }
            }

            // Calcular estadísticas
            const stats = {
                total: activities.length,
                rating100: activities.filter(a => a.ratingInfo.rating === 100).length,
                rating80: activities.filter(a => a.ratingInfo.rating === 80).length,
                rating50: activities.filter(a => a.ratingInfo.rating === 50).length,
                rating20: activities.filter(a => a.ratingInfo.rating === 20).length,
                rating0: activities.filter(a => a.ratingInfo.rating === 0).length,
            };

            // Calcular promedio
            let averageRating = 0;
            if (stats.total > 0) {
                const totalScore = (stats.rating100 * 100) + (stats.rating80 * 80) + (stats.rating50 * 50) + (stats.rating20 * 20) + (stats.rating0 * 0);
                averageRating = Math.round(totalScore / stats.total);
            }

            return {
                id: workerId,
                name: workerName,
                dayId: dayId,
                shift: shift,
                assignments: assignments,
                activities: activities,
                stats: stats,
                averageRating: averageRating,
                totalActivities: stats.total
            };

        } catch (error) {
            console.error("Error procesando turno del trabajador:", error);
            return null;
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

    function calculateActivityRating(activity) {
        // Si no está marcada como completada, calificación 0
        if (!activity.checkActivity) {
            return {
                rating: 0,
                status: "No marcada",
                delay: "Sin marcar",
                category: "incompleta"
            };
        }
        
        if (!activity.time || !activity.checkDate) {
            return {
                rating: 100,
                status: "Completa",
                delay: "Sin horario definido",
                category: "sin_horario"
            };
        }
        
        // Parsear tiempo programado de la actividad (ej: "12:00")
        const activityTime = parseActivityTime(activity.time, activity.dayId);
        // Parsear tiempo cuando se marcó como completada (timestamp de Firebase)
        const checkTime = activity.checkDate.toDate();
        
        if (!activityTime || !checkTime) {
            return {
                rating: 100,
                status: "Completa",
                delay: "Error en tiempos",
                category: "error"
            };
        }
        
        // Calcular diferencia en minutos (checkTime - activityTime)
        const diffMinutes = (checkTime.getTime() - activityTime.getTime()) / (1000 * 60);
        
        // Determinar categoría de la actividad
        const category = determineActivityCategory(activity.name);
        
        // Criterios por categoría
        const activityCriteria = {
            "critica": { // Medicamentos, signos vitales, hidratación
                onTime: 15,    // ±15 min = 100pts
                late1: 30,     // 30 min = 80pts
                late2: 60,     // 1h = 50pts
                late3: 120,    // 2h = 20pts
                early: -30     // Puede marcarse 30 min antes
            },
            "normal": { // Comida, higiene, cambio de pañal
                onTime: 30,    // ±30 min = 100pts
                late1: 60,     // 1h = 80pts
                late2: 120,    // 2h = 50pts
                late3: 240,    // 4h = 20pts
                early: -60     // Puede marcarse 1h antes
            },
            "flexible": { // Recreación, visitas, entrega de turno
                onTime: 60,    // ±1h = 100pts
                late1: 120,    // 2h = 80pts
                late2: 240,    // 4h = 50pts
                late3: 480,    // 8h = 20pts
                early: -120    // Puede marcarse 2h antes
            }
        };
        
        const criteria = activityCriteria[category] || activityCriteria["normal"];
        
        let rating, status, delay;
        
        // Formatear el retraso/adelanto
        const absMinutes = Math.abs(diffMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = Math.round(absMinutes % 60);
        
        if (diffMinutes < 0) {
            if (hours > 0) {
                delay = `${hours}h ${minutes}min temprano`;
            } else {
                delay = `${minutes}min temprano`;
            }
        } else if (diffMinutes === 0) {
            delay = "A tiempo exacto";
        } else {
            if (hours > 0) {
                delay = `${hours}h ${minutes}min tarde`;
            } else {
                delay = `${minutes}min tarde`;
            }
        }
        
        // Calcular calificación según criterios
        if (diffMinutes < criteria.early) {
            rating = 0;
            status = "Muy temprano";
        } else if (Math.abs(diffMinutes) <= criteria.onTime) {
            rating = 100;
            status = "Excelente";
        } else if (diffMinutes <= criteria.late1) {
            rating = 80;
            status = "Muy bueno";
        } else if (diffMinutes <= criteria.late2) {
            rating = 50;
            status = "Regular";
        } else if (diffMinutes <= criteria.late3) {
            rating = 20;
            status = "Malo";
        } else {
            rating = 0;
            status = "Muy malo";
        }
        
        return {
            rating: rating,
            status: status,
            delay: delay,
            category: category,
            diffMinutes: Math.round(diffMinutes)
        };
    }
    
    function determineActivityCategory(activityName) {
        const name = activityName.toLowerCase();
        
        // Actividades críticas
        if (name.includes('medicament') || 
            name.includes('medicina') ||
            name.includes('signos vitales') ||
            name.includes('vital') ||
            name.includes('hidratac') ||
            name.includes('revision') && name.includes('medic')) {
            return "critica";
        }
        
        // Actividades flexibles
        if (name.includes('entrega') && name.includes('turno') ||
            name.includes('recepcion') && name.includes('turno') ||
            name.includes('recreac') ||
            name.includes('visita') ||
            name.includes('entretenimiento') ||
            name.includes('actividad social')) {
            return "flexible";
        }
        
        // Actividades normales (por defecto)
        return "normal";
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

    function getRatingText(rating) {
        if (rating >= 90) return "Excelente";
        if (rating >= 70) return "Muy bueno"; 
        if (rating >= 50) return "Bueno";
        if (rating >= 30) return "Regular";
        if (rating > 0) return "Malo";
        return "Sin actividades";
    }

    function getRatingColor(rating) {
        if (rating >= 80) return "text-success";
        if (rating >= 60) return "text-primary";
        if (rating >= 40) return "text-warning";
        if (rating > 0) return "text-danger";
        return "text-muted";
    }

    function getRatingBadgeClass(rating) {
        if (rating >= 80) return "bg-success";
        if (rating >= 60) return "bg-primary";
        if (rating >= 40) return "bg-warning";
        if (rating > 0) return "bg-danger";
        return "bg-secondary";
    }

    function exportToCSV() {
        if (ratingsData.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Sin datos",
                text: "No hay datos para exportar."
            });
            return;
        }

        const headers = ["Fecha", "Trabajador", "Turno", "Calificación", "Total Actividades", "Responsabilidades"];
        const rows = ratingsData.map(rating => [
            rating.dateFormatted,
            rating.workerName,
            rating.shiftText,
            rating.rating,
            rating.totalActivities,
            rating.assignments ? rating.assignments.map(a => a.name).join("; ") : ""
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `calificaciones_responsables_${branchName}_${startDate}_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
</script>

<div class="page-content">
    <TitleBar title="Historial de Calificaciones de Responsables" base="Supervisión" />
    
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <label for="branch" class="form-label">Estancia</label>
                            <BranchesSearchList bind:value={selectedBranch} inlist={false} />
                        </div>
                        <div class="col-md-3">
                            <label for="startDate" class="form-label">Fecha inicio</label>
                            <input 
                                type="date" 
                                class="form-control" 
                                bind:value={startDate}
                                max={DateTime.local().toISODate()}
                            />
                        </div>
                        <div class="col-md-3">
                            <label for="endDate" class="form-label">Fecha fin</label>
                            <input 
                                type="date" 
                                class="form-control" 
                                bind:value={endDate}
                                max={DateTime.local().toISODate()}
                            />
                        </div>
                        <div class="col-md-3 d-flex align-items-end gap-2">
                            <button class="btn btn-secondary" on:click={() => pop()}>
                                <i class="bx bx-arrow-back"></i> Regresar
                            </button>
                            {#if ratingsData.length > 0}
                                <button class="btn btn-success" on:click={exportToCSV}>
                                    <i class="bx bx-download"></i> Exportar
                                </button>
                            {/if}
                        </div>
                    </div>

                    {#if selectedBranch && startDate && endDate}
                        <div class="row mb-3">
                            <div class="col-12">
                                <h4>
                                    {branchName} - 
                                    {DateTime.fromISO(startDate).setLocale("es-mx").toLocaleString(DateTime.DATE_SHORT)} 
                                    al 
                                    {DateTime.fromISO(endDate).setLocale("es-mx").toLocaleString(DateTime.DATE_SHORT)}
                                </h4>
                            </div>
                        </div>

                        {#if loading}
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="sr-only">Cargando...</span>
                                </div>
                                <p class="mt-2">Cargando historial de calificaciones...</p>
                            </div>
                        {:else if Object.keys(averagesByWorker).length === 0}
                            <div class="alert alert-info text-center">
                                <i class="bx bx-info-circle fs-4"></i>
                                <h5 class="mt-2">No hay calificaciones</h5>
                                <p>No se encontraron calificaciones para el rango de fechas seleccionado.</p>
                            </div>
                        {:else}
                            <!-- Resumen de promedios -->
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h5>Resumen de promedios por trabajador</h5>
                                    <div class="table-responsive">
                                        <table class="table table-hover">
                                            <thead class="table-primary">
                                                <tr>
                                                    <th>Trabajador</th>
                                                    <th>Promedio General</th>
                                                    <th>Promedio Diurno</th>
                                                    <th>Promedio Nocturno</th>
                                                    <th>Total Calificaciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {#each Object.entries(averagesByWorker) as [workerId, worker]}
                                                    <tr>
                                                        <td><strong>{worker.name}</strong></td>
                                                        <td>
                                                            <span class="badge {getRatingBadgeClass(worker.overall)} fs-6">
                                                                {worker.overall} pts
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {#if worker.dayRatings > 0}
                                                                <span class="badge {getRatingBadgeClass(worker.day)} fs-6">
                                                                    {worker.day} pts
                                                                </span>
                                                                <small class="text-muted">({worker.dayRatings})</small>
                                                            {:else}
                                                                <span class="text-muted">Sin turnos diurnos</span>
                                                            {/if}
                                                        </td>
                                                        <td>
                                                            {#if worker.nightRatings > 0}
                                                                <span class="badge {getRatingBadgeClass(worker.night)} fs-6">
                                                                    {worker.night} pts
                                                                </span>
                                                                <small class="text-muted">({worker.nightRatings})</small>
                                                            {:else}
                                                                <span class="text-muted">Sin turnos nocturnos</span>
                                                            {/if}
                                                        </td>
                                                        <td>
                                                            <span class="badge bg-info">{worker.totalRatings}</span>
                                                        </td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- Detalle por fecha -->
                            <div class="row">
                                <div class="col-12">
                                    <h5>Detalle de calificaciones por fecha</h5>
                                    {#each Object.values(groupedRatings).sort((a, b) => b.dayId.localeCompare(a.dayId)) as dayRating}
                                        <div class="card mb-3">
                                            <div class="card-header">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <h6 class="mb-0">
                                                        <i class="bx bx-user"></i> {dayRating.workerName}
                                                    </h6>
                                                    <small class="text-muted">{dayRating.dateFormatted}</small>
                                                </div>
                                            </div>
                                            <div class="card-body">
                                                <div class="row">
                                                    <!-- Turno Diurno -->
                                                    {#if dayRating.dayRating !== null}
                                                        <div class="col-md-6">
                                                            <div class="border rounded p-3">
                                                                <h6 class="text-primary">
                                                                    <i class="bx bx-sun"></i> Turno Diurno
                                                                </h6>
                                                                <div class="mb-2">
                                                                    <span class="badge {getRatingBadgeClass(dayRating.dayRating)} fs-6 me-2">
                                                                        {dayRating.dayRating} pts
                                                                    </span>
                                                                    <span class="{getRatingColor(dayRating.dayRating)}">
                                                                        {getRatingText(dayRating.dayRating)}
                                                                    </span>
                                                                </div>
                                                                
                                                                <!-- Estadísticas detalladas -->
                                                                {#if dayRating.dayStats}
                                                                    <div class="row text-center mb-2 small">
                                                                        <div class="col-2">
                                                                            <div class="text-success fw-bold">{dayRating.dayStats.rating100}</div>
                                                                            <div class="text-muted">100pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-info fw-bold">{dayRating.dayStats.rating80}</div>
                                                                            <div class="text-muted">80pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-warning fw-bold">{dayRating.dayStats.rating50}</div>
                                                                            <div class="text-muted">50pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-orange fw-bold">{dayRating.dayStats.rating20}</div>
                                                                            <div class="text-muted">20pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-danger fw-bold">{dayRating.dayStats.rating0}</div>
                                                                            <div class="text-muted">0pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-primary fw-bold">{dayRating.dayStats.total}</div>
                                                                            <div class="text-muted">Total</div>
                                                                        </div>
                                                                    </div>
                                                                {/if}
                                                                
                                                                {#if dayRating.dayAssignments.length > 0}
                                                                    <div>
                                                                        <strong>Responsabilidades:</strong>
                                                                        {#each dayRating.dayAssignments as assignment}
                                                                            <span class="badge bg-info me-1">{assignment.name}</span>
                                                                        {/each}
                                                                    </div>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                    {/if}

                                                    <!-- Turno Nocturno -->
                                                    {#if dayRating.nightRating !== null}
                                                        <div class="col-md-6">
                                                            <div class="border rounded p-3">
                                                                <h6 class="text-dark">
                                                                    <i class="bx bx-moon"></i> Turno Nocturno
                                                                </h6>
                                                                <div class="mb-2">
                                                                    <span class="badge {getRatingBadgeClass(dayRating.nightRating)} fs-6 me-2">
                                                                        {dayRating.nightRating} pts
                                                                    </span>
                                                                    <span class="{getRatingColor(dayRating.nightRating)}">
                                                                        {getRatingText(dayRating.nightRating)}
                                                                    </span>
                                                                </div>
                                                                
                                                                <!-- Estadísticas detalladas -->
                                                                {#if dayRating.nightStats}
                                                                    <div class="row text-center mb-2 small">
                                                                        <div class="col-2">
                                                                            <div class="text-success fw-bold">{dayRating.nightStats.rating100}</div>
                                                                            <div class="text-muted">100pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-info fw-bold">{dayRating.nightStats.rating80}</div>
                                                                            <div class="text-muted">80pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-warning fw-bold">{dayRating.nightStats.rating50}</div>
                                                                            <div class="text-muted">50pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-orange fw-bold">{dayRating.nightStats.rating20}</div>
                                                                            <div class="text-muted">20pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-danger fw-bold">{dayRating.nightStats.rating0}</div>
                                                                            <div class="text-muted">0pts</div>
                                                                        </div>
                                                                        <div class="col-2">
                                                                            <div class="text-primary fw-bold">{dayRating.nightStats.total}</div>
                                                                            <div class="text-muted">Total</div>
                                                                        </div>
                                                                    </div>
                                                                {/if}
                                                                
                                                                {#if dayRating.nightAssignments.length > 0}
                                                                    <div>
                                                                        <strong>Responsabilidades:</strong>
                                                                        {#each dayRating.nightAssignments as assignment}
                                                                            <span class="badge bg-warning me-1">{assignment.name}</span>
                                                                        {/each}
                                                                    </div>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    {:else}
                        <div class="alert alert-warning text-center">
                            <i class="bx bx-info-circle fs-4"></i>
                            <h5 class="mt-2">Selecciona parámetros</h5>
                            <p>Selecciona una estancia y rango de fechas para ver el historial de calificaciones.</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .badge.fs-6 {
        font-size: 1rem;
        padding: 0.5rem 0.75rem;
    }
    
    .table th {
        border-top: none;
    }
    
    .text-orange {
        color: #fd7e14 !important;
    }
</style>
