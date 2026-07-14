<script>
    import TitleBar from "../TitleBar.svelte";
    import WorkersSearchList from "../controls/WorkersSearchList.svelte";
    import { link } from "svelte-spa-router";
    import { pop } from "svelte-spa-router";
    import swal from 'sweetalert';
    import PositionsSearchList from "../controls/PositionsSearchList.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import WorkersSearchListFiltered from "../controls/WorkersSearchListFiltered.svelte";
    import { onMount, onDestroy } from "svelte";
    import { workers } from "../controls/workers.js";
    import { positions } from "../controls/positions.js";
    import { branches } from "../controls/branches.js";
    import { permissions } from "../stores.js";

    export let bid;

    let workpositions = [];
    let unsubBranch;
    let residents = 0;
    let active_scanner;
    let posAsign = {};
    let weekNew = [];
    var tdate = DateTime.local().setLocale("es-mx");
    let today = tdate.toISODate();
    let yesterday = tdate.minus({ days: 1 }).toISODate();
    let twoDaysAgo = tdate.minus({ days: 2 }).toISODate(); 
    let threeDaysAgo = tdate.minus({ days: 3 }).toISODate(); 
    let fourDaysAgo = tdate.minus({ days: 4 }).toISODate(); 
    let validDays = [today, yesterday, twoDaysAgo, threeDaysAgo, fourDaysAgo]; 
    let test = tdate.minus({ days: 1 });
    let nightdate = test.toISODate();
    let nightShift = "";
    let showModal = false;
    let editData = {};
    let faltaData = {};
    let uName = "";
    let loading = false;
    let modalworker = "";
    let comments = {};
    let commentsNight = {};
    let faltaComment;
    let size;
    let assistants;
    let assisLenght;
    let absence;
    let absenceLenght;
    let assisList = {};
    let fingerSdk;
    let fingerReader;
    let fingerImg;
    let selectedWorker = "";
    let candidates = [];
    let candidatesMap = {};
    let enrolling = false;
    let unsubWorkers;
    let canConfirm = false;
    let interval;
    let asignYesterday;
    let confYesterday;
    let confYesterdayNight;
    let selectedWorkers = [{ name: '' }];
    let aId;
    let isNight;
    let day;
    let user;
    let compartidaQueue = [];
    let compartidaResults = [];
    let currentCompartida = null;
    let shiftLimitsReached = {}; // Para manejar el estado de límites alcanzados

    $: bid, getWOrkroles();

    // Función reactiva para verificar límites cuando cambian los datos
    $: {
        if (workpositions.length > 0 && bid) {
            updateShiftLimitsStatus();
        }
    }

    // Función auxiliar para calcular guardias adicionales por ingresos de pacientes
    async function calculateAdditionalShifts(branchId, workroleId = null) {
        let additionalShifts = 0;
        
        // Buscar el workrole para verificar si tiene la posición específica "ZUkMnvuKWrwbMJZIfgDS"
        const workrole = workpositions.find(wr => wr.id === workroleId);
        if (!workrole || workrole.positions !== "ZUkMnvuKWrwbMJZIfgDS") {
            return additionalShifts;
        }
        
        try {
            const startOfMonth = window.DateTime.now().startOf('month').toFormat('yyyy-MM-dd');
            const endOfMonth = window.DateTime.now().endOf('month').toFormat('yyyy-MM-dd');

            const snapshot = await db.collection('patients')
                .where('entrydate', '>=', startOfMonth)
                .where('entrydate', '<=', endOfMonth)
                .where('branch', '==', branchId)
                .get();

            const patientEntries = snapshot.size;
            additionalShifts = patientEntries * 2; // 2 guardias adicionales por ingreso
        } catch (error) {
            console.error('Error fetching patient entries for additional shifts:', error);
        }
        return additionalShifts;
    }

    async function updateShiftLimitsStatus() {
        // console.log("🔍 DEBUG ScheduleLog: Actualizando estado de límites de guardias");
        const newLimitsStatus = {};
        for (const position of workpositions) {
            // console.log(`📋 DEBUG ScheduleLog: Posición ${position.id} - limitShifts: ${position.limitShifts}`);
            if (position.limitShifts !== undefined && position.limitShifts > 0) {
                const limitReached = await hasReachedShiftLimit(position.id);
                newLimitsStatus[position.id] = limitReached;
                // console.log(`✅ DEBUG ScheduleLog: Posición ${position.id} - Límite alcanzado: ${limitReached}`);
            } else {
                // console.log(`❌ DEBUG ScheduleLog: Posición ${position.id} - Sin límite configurado o límite <= 0`);
            }
        }
        shiftLimitsReached = newLimitsStatus;
        console.log("🎯 DEBUG ScheduleLog: Estado final de límites:", shiftLimitsReached);
    }

    // Función para obtener el día en que se alcanzó el límite por primera vez
    async function getShiftLimitReachedDate(positionId) {
        const position = workpositions.find(pos => pos.id === positionId);
        if (!position || position.limitShifts === undefined || position.limitShifts <= 0) {
            return null;
        }

        // Calcular guardias adicionales por ingresos de pacientes
        // Solo aplicar para workroles que tengan la posición específica "ZUkMnvuKWrwbMJZIfgDS"
        let additionalShifts = 0;
        if (position.positions === "ZUkMnvuKWrwbMJZIfgDS") {
            try {
                const startOfMonth = window.DateTime.now().startOf('month').toFormat('yyyy-MM-dd');
                const endOfMonth = window.DateTime.now().endOf('month').toFormat('yyyy-MM-dd');

                const snapshot = await db.collection('patients')
                    .where('entrydate', '>=', startOfMonth)
                    .where('entrydate', '<=', endOfMonth)
                    .where('branch', '==', position.branches)
                    .get();

                const patientEntries = snapshot.size;
                additionalShifts = patientEntries * 2;
            } catch (error) {
                console.error('Error fetching patient entries for limit calculation:', error);
            }
        }

        const dynamicLimit = position.limitShifts + additionalShifts;

        try {
            const currentDate = DateTime.local().setLocale("es-mx");
            const startOfMonth = currentDate.startOf('month').toISODate();
            const endOfMonth = currentDate.endOf('month').toISODate();

            const snapshot = await db.collection("asignments")
                .where("branches", "==", bid)
                .where("dayId", ">=", startOfMonth)
                .where("dayId", "<=", endOfMonth)
                .orderBy("dayId", "asc")
                .get();

            let totalShifts = 0;
            let limitReachedDate = null;

            snapshot.forEach((doc) => {
                const data = doc.data();
                let dayShifts = 0;

                // Contar guardias del día
                if (data.day && data.day[positionId] && data.day[positionId] !== "") {
                    dayShifts++;
                }
                if (data.night && data.night[positionId] && data.night[positionId] !== "") {
                    dayShifts++;
                }

                totalShifts += dayShifts;

                // Si es el primer día que se alcanza el límite, guardarlo
                if (totalShifts >= dynamicLimit && limitReachedDate === null) {
                    limitReachedDate = data.dayId;
                }
            });

            return limitReachedDate;
        } catch (error) {
            console.error("Error getting shift limit reached date:", error);
            return null;
        }
    }

    // Función para verificar si una posición ha alcanzado su límite de guardias mensual
    async function hasReachedShiftLimit(positionId) {
        // console.log(`🚀 DEBUG ScheduleLog: Verificando límite para posición ${positionId}`);
        
        const position = workpositions.find(pos => pos.id === positionId);
        if (!position || position.limitShifts === undefined || position.limitShifts <= 0) {
            // console.log(`❌ DEBUG ScheduleLog: Posición ${positionId} - No encontrada o sin límite válido`);
            return false;
        }

        // Calcular guardias adicionales por ingresos de pacientes
        // Solo aplicar para workroles que tengan la posición específica "ZUkMnvuKWrwbMJZIfgDS"
        let additionalShifts = 0;
        console.log(`🔍 DEBUG ScheduleLog: Verificando workrole ${positionId} - position.positions: ${position.positions} - estancia: ${position.branches}`);
        if (position.positions === "ZUkMnvuKWrwbMJZIfgDS") {
            try {
                const startOfMonth = window.DateTime.local().plus({ months: 1 }).startOf('month').toFormat('yyyy-MM-dd');
                const endOfMonth = window.DateTime.local().plus({ months: 1 }).endOf('month').toFormat('yyyy-MM-dd');

                // console.log(`📅 DEBUG ScheduleLog: Buscando pacientes del ${startOfMonth} al ${endOfMonth} en sucursal ${position.branches}`);

                const snapshot = await db.collection('patients')
                    .where('entrydate', '>=', startOfMonth)
                    .where('entrydate', '<=', endOfMonth)
                    .where('branch', '==', position.branches) // Filtrar por sucursal
                    .get();

                const patientEntries = snapshot.size;
                additionalShifts = patientEntries * 2; // 2 guardias adicionales por ingreso
                // console.log(`📊 DEBUG ScheduleLog: Workrole ${positionId} con posición especial ${position.positions} - Sucursal ${position.branches} - Pacientes ingresados este mes: ${patientEntries}, Guardias adicionales: ${additionalShifts}`);
                
                // Mostrar detalles de los pacientes encontrados
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // console.log(`👤 DEBUG ScheduleLog: Paciente encontrado - ID: ${doc.id}, entrydate: ${data.entrydate}, branch: ${data.branch}`);
                });
                
            } catch (error) {
                console.error('Error fetching patient entries for shift limit calculation:', error);
            }
        } else {
            console.log(`📊 DEBUG ScheduleLog: Workrole ${positionId} con posición ${position.positions} - No aplica guardias adicionales por ingresos (solo para ZUkMnvuKWrwbMJZIfgDS)`);
        }

        // Calcular el límite dinámico (límite base + guardias adicionales)
        const dynamicLimit = position.limitShifts + additionalShifts;

        // console.log(`📊 DEBUG ScheduleLog: CÁLCULO LÍMITE DINÁMICO para workrole ${positionId}:`);
        // console.log(`   - Posición: ${position.positions}`);
        // console.log(`   - Límite base configurado: ${position.limitShifts}`);
        // console.log(`   - Guardias adicionales calculadas: ${additionalShifts}`);
        // console.log(`   - LÍMITE DINÁMICO FINAL: ${dynamicLimit}`);

        // Obtener el mes actual
        const currentDate = DateTime.local().setLocale("es-mx");
        const startOfMonth = currentDate.startOf('month').toISODate();
        const endOfMonth = currentDate.endOf('month').toISODate();
        
        // console.log(`📅 DEBUG ScheduleLog: Rango del mes actual: ${startOfMonth} a ${endOfMonth}`);
        // console.log(`🏢 DEBUG ScheduleLog: Branch ID: ${bid}`);
        
        try {
            // Consultar todas las asignaciones del mes actual desde Firebase
            const snapshot = await db.collection("asignments")
                .where("branches", "==", bid)
                .where("dayId", ">=", startOfMonth)
                .where("dayId", "<=", endOfMonth)
                .get();

            // console.log(`📋 DEBUG ScheduleLog: Total de documentos encontrados: ${snapshot.size}`);

            let totalShifts = 0;
            let dayShifts = 0;
            let nightShifts = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                // console.log(`📄 DEBUG ScheduleLog: Documento ${doc.id} - dayId: ${data.dayId}`);
                // console.log(`📄 DEBUG ScheduleLog: Estructura del documento:`, data);
                // console.log(`📄 DEBUG ScheduleLog: data.day:`, data.day);
                // console.log(`📄 DEBUG ScheduleLog: data.night:`, data.night);
                // console.log(`📄 DEBUG ScheduleLog: Buscando posición ${positionId} en data.day[${positionId}]:`, data.day ? data.day[positionId] : 'undefined');
                // console.log(`📄 DEBUG ScheduleLog: Buscando posición ${positionId} en data.night[${positionId}]:`, data.night ? data.night[positionId] : 'undefined');
                
                // Contar guardias diurnas
                if (data.day && data.day[positionId] && data.day[positionId] !== "") {
                    dayShifts++;
                    totalShifts++;
                    // console.log(`☀️ DEBUG ScheduleLog: Guardia diurna encontrada - Trabajador: ${data.day[positionId]} - Día: ${data.dayId}`);
                }
                
                // Contar guardias nocturnas
                if (data.night && data.night[positionId] && data.night[positionId] !== "") {
                    nightShifts++;
                    totalShifts++;
                    // console.log(`🌙 DEBUG ScheduleLog: Guardia nocturna encontrada - Trabajador: ${data.night[positionId]} - Día: ${data.dayId}`);
                }
            });

            console.log(`📊 DEBUG ScheduleLog: RESUMEN para posición ${positionId}:`);
            console.log(`   - Guardias diurnas: ${dayShifts}`);
            console.log(`   - Guardias nocturnas: ${nightShifts}`);
            console.log(`   - Total guardias: ${totalShifts}`);
            console.log(`   - Límite base: ${position.limitShifts}`);
            console.log(`   - Guardias adicionales: ${additionalShifts}`);
            console.log(`   - Límite dinámico: ${dynamicLimit}`);
            console.log(`   - ¿Límite alcanzado?: ${totalShifts >= dynamicLimit}`);

            return totalShifts >= dynamicLimit;
        } catch (error) {
            console.error("❌ DEBUG ScheduleLog: Error checking shift limits:", error);
            return false;
        }
    }

    // Función para mostrar alerta cuando se intenta editar una posición con límite alcanzado
    async function checkShiftLimitBeforeEdit(positionId, callback) {
        // console.log(`🔍 DEBUG ScheduleLog: Verificando límite antes de editar posición ${positionId}`);
        const limitReached = await hasReachedShiftLimit(positionId);
        // console.log(`✅ DEBUG ScheduleLog: Límite alcanzado: ${limitReached}, Es admin: ${$permissions.admin}`);
        
        if (limitReached && !$permissions.admin) {
            const position = workpositions.find(pos => pos.id === positionId);
            const additionalShifts = await calculateAdditionalShifts(position.branches, positionId);
            const dynamicLimit = position.limitShifts + additionalShifts;
            
            // console.log(`🚫 DEBUG ScheduleLog: Bloqueando edición - Límite alcanzado y no es admin`);
            swal(
                "Límite mensual alcanzado",
                `El puesto ha alcanzado su límite mensual dinámico de ${dynamicLimit} guardias (base: ${position.limitShifts} + adicionales por ingresos: ${additionalShifts}). Solo los administradores pueden realizar más asignaciones.`,
                "warning"
            );
            return false;
        }
        // console.log(`✅ DEBUG ScheduleLog: Permitiendo edición - Límite no alcanzado o es admin`);
        return callback();
    }

    onMount(() => {
        connectFinger();

        // initWeek every half hour
        interval = setInterval(function () {
            tdate = DateTime.local().setLocale("es-mx");
            today = tdate.toISODate();
            yesterday = tdate.minus({ days: 1 }).toISODate();
            initWeek();
        }, 3600000);
    });

    onDestroy(() => {
        if (interval != undefined) {
            clearInterval(interval);
        }
        if (unsubBranch != undefined) {
            unsubBranch();
        }
        if (unsubWorkers != undefined) {
            unsubWorkers();
        }
        if (fingerSdk != undefined) {
            fingerSdk.stopAcquisition();
        }
    });
    async function connectFinger() {
        fingerSdk = new Fingerprint.WebApi();
        let allReaders = await fingerSdk.enumerateDevices();

        if (allReaders.length > 0) {
            fingerReader = allReaders[0];
            // console.log("got reader", fingerReader);
            fingerSdk.onSamplesAcquired = function (s) {
                // Sample acquired event triggers this function
                //sampleAcquired(s);
                // // console.log("sample acquired", s);
                var samples = JSON.parse(s.samples);
                var sampleData = Fingerprint.b64UrlTo64(samples[0]);
                fingerImg = "data:image/png;base64," + sampleData;
                // // console.log("intermediate", samples);
                if (enrolling) {
                    fetch("http://localhost:8000/enroll", {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                        method: "POST",
                        body: sampleData, //JSON.stringify({"Data":sampleData})
                    })
                        .then((res) => {
                            return res.json();
                        })
                        .then((res) => {
                            if (res.result == "enroll") {
                                db.collection("workers")
                                    .doc(selectedWorker)
                                    .update({ fmd: res.fmd })
                                    .then(() => {
                                        selectedWorker = "";
                                        enrolling = false;
                                    });
                            }

                            // console.log(res);
                        })
                        .catch((err) => {
                            // console.log(err);
                        });
                } else {
                    let candidatesData = [];
                    candidates.forEach((element) => {
                        candidatesData.push({
                            id: element.id,
                            fmd: element.fmd,
                        });
                    });
                    fetch("http://localhost:8000/identify", {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                        },
                        method: "POST",
                        body: JSON.stringify({
                            Data: sampleData,
                            Candidates: candidatesData,
                        }),
                    })
                        .then((res) => {
                            return res.json();
                        })
                        .then((res) => {
                            // console.log("identify", res);
                            if (res.result == "not_found") {
                                swal("No se encontró el empleado", "", "error");
                                return;
                            }
                            if (res.result == "found") {
                                let worker = res.uid;
                                let asign = posAsign[today];

                                let isDay = true;
                                let getHour =
                                    DateTime.local().setLocale("es-mx").hour;
                                if (getHour >= 18 || getHour < 6) {
                                    isDay = false;
                                }
                                let posFound;
                                console.log(
                                    "asign",
                                    isDay,
                                    workpositions,
                                    asign,
                                );
                                for (let w = 0; w < workpositions.length; w++) {
                                    let pos = workpositions[w].id;
                                    // console.log("pos", pos);
                                    if (isDay) {
                                        if (asign.day[pos] == worker) {
                                            posFound = workpositions[w];
                                            break;
                                        }
                                    } else {
                                        if (asign.night[pos] == worker) {
                                            posFound = workpositions[w];
                                            break;
                                        }
                                    }
                                }
                                if (posFound == undefined) {
                                    swal(
                                        "El empleado no tiene turnos en esta estancia",
                                        "",
                                        "error",
                                    );
                                    return;
                                }
                                // console.log("pos found", posFound, asign);
                                if (isDay) {
                                    if (
                                        asign.assistence != undefined &&
                                        asign.assistence[worker] != undefined
                                    ) {
                                        swal(
                                            "El empleado ya tiene asistencia registrada el dia de hoy",
                                            "",
                                            "error",
                                        );
                                        return;
                                    }
                                } else {
                                    if (
                                        asign.assistencenight != undefined &&
                                        asign.assistencenight[worker] !=
                                            undefined
                                    ) {
                                        swal(
                                            "El empleado ya tiene asistencia registrada esta noche",
                                            "",
                                            "error",
                                        );
                                        return;
                                    }
                                }
                                console.log(
                                    worker,
                                    asign.aId,
                                    today,
                                    posFound.positions,
                                    posFound.pay,
                                    false,
                                    !isDay,
                                );
                                checkAssistance(
                                    worker,
                                    asign.aId,
                                    today,
                                    posFound.positions,
                                    posFound.pay,
                                    false,
                                    !isDay,
                                );
                                swal("Asistencia registrada", "", "success");
                            }
                        })
                        .catch((err) => {
                            // console.log(err);
                            swal("Error al identificar :" + err, "", "error");
                        });
                }
            };
            //Fingerprint.SampleFormat.Compressed
            fingerSdk.startAcquisition(
                Fingerprint.SampleFormat.PngImage,
                fingerReader,
            ); //Intermediate
            unsubWorkers = workers.subscribe((value) => {
                // // console.log($workers);
                // // console.log("workers changed", value);
                candidates = [];
                candidatesMap = {};
                if (value.length > 0) {
                    value.forEach((element) => {
                        if (element.fmd) {
                            candidates.push(element);
                            candidatesMap[element.id] = true;
                        }
                    });

                    candidates = candidates;
                    candidatesMap = candidatesMap;
                }
            });
        }
    }
    function enrollFinger() {
        enrolling = true;
        if (selectedWorker == "") {
            return;
        }
    }
    function stopEnroll() {
        enrolling = false;
        selectedWorker = "";
    }

    function getWOrkroles() {
        if (unsubBranch != undefined) {
            unsubBranch();
        }
        if (bid == undefined || bid == "") {
            return;
        }
        // 🔄 Hacer la consulta reactiva para detectar cambios en limitShifts
        db.collection("workroles")
            .where("branches", "==", bid)
            .orderBy("pay", "desc")
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    //doc.data().base_pay !== "";
                    // // console.log(`${doc.id} => ${doc.data()}`);
                    const temppositions = doc.data();
                    temppositions.id = doc.id;
                    $positions.forEach((element) => {
                        if (element.id == temppositions.positions) {
                            temppositions.name = element.name;
                        }
                    });
                    tmp.push(temppositions);
                    if (
                        doc.data().pay == null ||
                        doc.data().pay == undefined ||
                        doc.data().pay == ""
                    ) {
                        $workers.forEach((element) => {
                            let options = [];
                            if (element.options) {
                                for (
                                    var i = 0;
                                    i < element.options.length;
                                    i++
                                ) {
                                    if (
                                        [element.options[i].positions] ==
                                            doc.data().positions &&
                                        [element.options[i].pay] != null &&
                                        [element.options[i].pay] != "0" &&
                                        [element.options[i].pay] != undefined
                                    ) {
                                        // // console.log(element.options[i].pay);
                                        // // console.log([element.options[i].positions]);
                                        temppositions.pay =
                                            element.options[i].pay;
                                    } else {
                                        $positions.forEach((element) => {
                                            if (
                                                element.base_pay &&
                                                element.id ==
                                                    temppositions.positions
                                            ) {
                                                temppositions.pay =
                                                    element.base_pay;
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
                workpositions = tmp;
                // console.log("🔄 DEBUG ScheduleLog: Workroles actualizados", workpositions)
                let shift = tmp.find((shift) => shift.shift_night == "1");
                nightShift = shift;
                
                // 🔄 Recalcular límites cuando cambien los workroles
                // console.log("🔄 DEBUG ScheduleLog: Workroles cambiaron, recalculando límites");
                if (workpositions.length > 0 && bid) {
                    updateShiftLimitsStatus();
                }
                // // console.log(nightShift);
            });
        unsubBranch = db
            .collection("branches")
            .doc(bid)
            .onSnapshot((querySnapshot) => {
                if (querySnapshot.exists) {
                    residents = querySnapshot.data().residents;
                    active_scanner = querySnapshot.data().active_service;
                    // // console.log(residents);
                }
            });
    }
    //Aqui generar los ids con la libreria . ej en CaptureInventory.svelte
    //startOf('week') esta funcion te lleva al incio de la semana;
    let cdate = DateTime.local().setLocale("es-mx").startOf("week");
    //// console.log(cdate);

    initWeek();

    function initWeek() {
        //let dayId = cdate.toISODate();
        //ESTO solo jala cuando ya se habia asignado una semana
        for (let wd = 0; wd < weekNew.length; wd++) {
            const element = weekNew[wd];
            if (element.unsub != undefined) {
                element.unsub();
                element.unsub = null;
            }
        }

        //reseteo la semana
        weekNew = [];
        // me voy del lunes al dia 7
        for (let index = 0; index < 7; index++) {
            // al dia de inicio de semana le sumo index dias
            let dayNext = cdate.plus({ days: index });
            //saco el id
            const dId = dayNext.toISODate();
            posAsign[dId] = {};
            posAsign[dId].branches = bid;
            posAsign[dId].dayId = dId;
            posAsign[dId].day = {};
            posAsign[dId].night = {};
            //carga las asignaciones de la semana
            var unsubwek = db
                .collection("asignments")
                .where("dayId", "==", dId)
                .onSnapshot((querySnapshot) => {
                    for (let wd = 0; wd < weekNew.length; wd++) {
                        const element = weekNew[wd];
                        if (element.id == dId) {
                            element.loading = false;
                            let foundDoc = false;
                            // // console.log('found assigments '+dId, querySnapshot.size);
                            querySnapshot.forEach(function (doc) {
                                // doc.data() is never undefined for query doc snapshots
                                const data = doc.data();
                                //weekNew[wd].aid = data.id;
                                if (data.branches == bid) {
                                    foundDoc = true;
                                    posAsign[dId] = data;
                                    posAsign[dId].aId = doc.id;
                                    if (posAsign[dId].day == undefined) {
                                        posAsign[dId].day = {};
                                    }
                                    if (posAsign[dId].night == undefined) {
                                        posAsign[dId].night = {};
                                    }
                                } else {
                                    element.asigned = [
                                        ...element.asigned,
                                        ...Object.values(data),
                                    ];
                                }
                            });
                            if (!foundDoc) {
                                posAsign[dId].added = timenow;
                                element.added = true;
                            }
                        }
                    }

                    weekNew = weekNew;
                    
                    // 🔄 Trigger para actualizar límites cuando cambien las asignaciones
                    // console.log("🔄 DEBUG ScheduleLog: Asignaciones actualizadas, recalculando límites");
                    if (workpositions.length > 0 && bid) {
                        updateShiftLimitsStatus();
                    }
                    //    // console.log(weekNew)
                });

            weekNew.push({
                date: dayNext,
                id: dId,
                unsub: unsubwek,
                asigned: [],
                added: false,
                loading: true,
            });
        }
        // // console.log('posAsign',posAsign);
        weekNew = weekNew;
    }

    function prevWeek() {
        cdate = cdate.minus({ days: 7 });
        // // console.log(cdate);
        initWeek();
    }

    function nextWeek() {
        cdate = cdate.plus({ days: 7 });
        // // console.log(cdate);
        initWeek();
    }

    function refreshWeek() {
        cdate = cdate;
        // // console.log(cdate);
        initWeek();
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("branches").doc(id).update(update);
    }
    //checa que jale
    function addPaidPostition() {
        let payPos = {
            branches: "A4JNT4BK8ScnTNhsF9XZ",
            id: "paid-" + workpositions.length,
            pay: 0,
            paid: true,
            positions: "SOZJKwbEJZrwW2B974T4",
        };
        workpositions.push(payPos);
        workpositions = workpositions;
    }
    //checa que jale
    async function asigninWeek(dId, pId) {
        // console.log('🚀 DEBUG ScheduleLog: asigninWeek - Día:', dId, 'Posición:', pId);
        let foundDay = false;
        let userId = "";

        // Verificar el límite de guardias mensual
        const position = workpositions.find(pos => pos.id === pId);
        // console.log('📋 DEBUG ScheduleLog: Posición encontrada:', position);
        
        if (position && position.limitShifts !== undefined) {
            // console.log(`🔍 DEBUG ScheduleLog: Verificando límite para posición ${pId} - Límite: ${position.limitShifts}`);
            const limitReached = await hasReachedShiftLimit(pId);
            // console.log(`✅ DEBUG ScheduleLog: Resultado límite alcanzado: ${limitReached}, Es admin: ${$permissions.admin}`);
            
            if (limitReached && !$permissions.admin) {
                // console.log('🚫 DEBUG ScheduleLog: Bloqueando asignación - Límite alcanzado y no es admin');
                const additionalShifts = await calculateAdditionalShifts(position.branches, pId);
                const dynamicLimit = position.limitShifts + additionalShifts;
                
                swal(
                    "Límite mensual alcanzado",
                    `El puesto ha alcanzado su límite mensual dinámico de ${dynamicLimit} guardias (base: ${position.limitShifts} + adicionales por ingresos: ${additionalShifts}).`,
                    "warning"
                );
                return;
            }
        }

        for (let index = 0; index < weekNew.length; index++) {
            const element = weekNew[index];
            if (element.id == dId) {
                //// console.log('foundDay');
                foundDay = true;
                userId = posAsign[dId].day[pId];
            } else if (foundDay) {
                posAsign[element.id].day[pId] = userId;
            }
        }
        posAsign = posAsign;
    }
    //otra funcion para guardar el posAsign[deldia] en firebase en "asignments", agregandole el branchid
    function saveDay(dId) {
        Swal.fire({
            title: "¿Esta seguro?",
            text: "Desea asignar este día",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Si, guardar!",
        }).then(function (result) {
            if (result.value) {
                db.collection("asignments").add(posAsign[dId]);
                for (let index = 0; index < weekNew.length; index++) {
                    const element = weekNew[index];
                    if (element.id == dId) {
                        element.added = true;
                    }
                }
                weekNew = weekNew;
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }
    //Se guarda la informacion en patientlog para generar el pago
    async function checkInAll(userId, aid, day, position, pay, late, isNight, isSharedShiftCall = false) {
        // console.log(userId, aid, day, position, pay, late, isNight);
        var added = DateTime.fromISO(day).plus({ hours: 1 }).toJSDate();
        var values = {};
        let checkdate = DateTime.local().toLocaleString(DateTime.TIME_24_SIMPLE);
        let addeddate = timenow;
        let w;
        let p;
        let newPay;
        let sharedPay;
        let sharedShift = {};

        // 1. Buscar worker y determinar el nuevo pago
        for (let index = 0; index < $workers.length; index++) {
            const element = $workers[index];
            if (userId == element.id) {
                w = element;
                break;
            }
        }

        newPay = undefined;

        if (w) {
            // 1. element.options (worker)
            if (w.options) {
                for (let i = 0; i < w.options.length; i++) {
                    if (
                        w.options[i].positions == position &&
                        w.options[i].pay != null &&
                        w.options[i].pay != "0" &&
                        w.options[i].pay != undefined
                    ) {
                        newPay = w.options[i].pay;
                        break;
                    }
                }
            }
            // 2. w.pay
            if ((newPay == undefined || newPay == null || newPay == "0") && w.pay) {
                newPay = w.pay;
            }
            // 3. $positions.options
            if (newPay == undefined || newPay == null || newPay == "0") {
                for (let index = 0; index < $positions.length; index++) {
                    const element = $positions[index];
                    if (element.id == position && element.options) {
                        for (let i = 0; i < element.options.length; i++) {
                            if (
                                element.options[i].pay != null &&
                                element.options[i].pay != "0" &&
                                element.options[i].pay != undefined &&
                                bid == element.options[i].branches
                            ) {
                                newPay = element.options[i].pay;
                                break;
                            }
                        }
                        p = element;
                        break;
                    }
                }
            }
            // 4. base_pay
            if (newPay == undefined || newPay == "0" || newPay == null) {
                newPay = p?.base_pay ?? pay;
            }
        } 
        // else {
        //     // NO active_share
        //     newPay = 0; // Resetear el nuevo pago a 0 antes de buscar en las siguientes prioridades
        //     // 1.  w.pay
        //     if ((newPay == undefined || newPay == "0" || newPay == null) && w && w.pay) {
        //         newPay = w.pay;
        //     }
            
        //     // 2. element.options (worker)
        //     if ((newPay == undefined || newPay == null || newPay == "0") && w && w.options) {
        //         for (let i = 0; i < w.options.length; i++) {
        //             if (
        //                 w.options[i].positions == position &&
        //                 w.options[i].pay != null &&
        //                 w.options[i].pay != "0" &&
        //                 w.options[i].pay != undefined
        //             ) {
        //                 newPay = w.options[i].pay;
        //                 break;
        //             }
        //         }
        //     }
        //     // 3. $positions.options
        //     for (let index = 0; index < $positions.length; index++) {
        //         const element = $positions[index];
        //         if (element.id == position && element.options) {
        //             for (let i = 0; i < element.options.length; i++) {
        //                 if (
        //                     element.options[i].pay != null &&
        //                     element.options[i].pay != "0" &&
        //                     element.options[i].pay != undefined &&
        //                     bid == element.options[i].branches
        //                 ) {
        //                     newPay = element.options[i].pay;
        //                     break;
        //                 }
        //             }
        //             p = element;
        //             break;
        //         }
        //     }
        //     // 4. base_pay
        //     if (newPay == undefined || newPay == "0" || newPay == null) {
        //         newPay = p?.base_pay ?? pay;
        //     }
        // }

        if (newPay == undefined || newPay == "0" || newPay == null) {
            Swal.fire({
                title: "Existe un usuario sin sueldos agregados!",
                text: "Aviso",
                type: "warning",
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
            });
            return;
        }

        await db.collection("workpay").add({
            added: new Date(),
            branches: bid,
            users: userId,
            day: day,
            positions: position,
            late: late,
            hour: checkdate,
        });

        // ✅ SOLO procesar guardias compartidas si es una llamada específica para eso
        // Para asistencias normales (isSharedShiftCall = false), NUNCA marcar como compartida
        let patientLogData = {
            created: new Date(),
            added: added,
            branch: bid,
            createdBy: "pending",
            uid: userId,
            positions: position,
            type: 0,
            units: 1,
            amount: newPay,
            nightShift: isNight
        };

        // ✅ NO agregar propiedades de guardia compartida para asistencias normales
        // Las guardias compartidas se procesan por separado en continueConfirmAll

        await db.collection("patientlog").add(patientLogData);

        // // Al final de continueConfirmAll (solo una vez por confirmación)
        // let sharedDoc = await db.collection("asignments").doc(aid).get();
        // if (sharedDoc.exists) {
        //     let sharedData = sharedDoc.data();
        //     let sharedPrefix = isNight ? "sharedNight_" : "sharedDay_";
        //     let sharedFields = Object.keys(sharedData).filter(key => key.startsWith(sharedPrefix));

        //     for (let field of sharedFields) {
        //         let sharedArray = sharedData[field];
        //         if (Array.isArray(sharedArray) && sharedArray.length > 0) {
        //             let positionId = field.replace(sharedPrefix, "");

        //             // Busca el worker "compartida" SOLO dentro de este array
        //             let compartidaWorker = $workers.find(w =>
        //                 w.active_share && sharedArray.includes(w.id)
        //             );
        //             if (!compartidaWorker) continue; // Si no hay worker compartida en este array, salta

        //             // Busca el sueldo correcto SOLO del worker compartida de este puesto
        //             let sharedPay = 0;
        //             if (compartidaWorker.options) {
        //                 for (let opt of compartidaWorker.options) {
        //                     if (
        //                         opt.positions == positionId &&
        //                         opt.pay != null &&
        //                         opt.pay != "0" &&
        //                         opt.pay != undefined
        //                     ) {
        //                         sharedPay = Number(opt.pay);
        //                         break;
        //                     }
        //                 }
        //             }
        //             if (!sharedPay || sharedPay === 0) {
        //                 sharedPay = compartidaWorker.pay ? Number(compartidaWorker.pay) : 0;
        //             }
        //             let count = sharedArray.length;
        //             let payPerWorker = sharedPay / count;

        //             // Genera un recibo SOLO para cada empleado del array de este puesto
        //             for (let workerId of sharedArray) {
        //                 await db.collection("patientlog").add({
        //                     created: new Date(),
        //                     added: DateTime.fromISO(day).plus({ hours: 1 }).toJSDate(),
        //                     branch: bid,
        //                     createdBy: "pending",
        //                     uid: workerId,
        //                     positions: positionId,
        //                     type: 0,
        //                     units: 1,
        //                     amount: payPerWorker,
        //                     nightShift: isNight,
        //                     sharedShift: { [positionId]: sharedArray },
        //                     shared: true
        //                 });
        //             }
        //         }
        //     }
        // }
    }
    //guarda la informacion en asignments con la hora del check-in
    function checkAssistance(userId, aid, day, position, pay, late, isNight) {
        // console.log(userId, aid, day, position, pay, late, isNight);
        var values = {};
        let checkdate = DateTime.local().toLocaleString(
            DateTime.TIME_24_SIMPLE,
        );
        if (isNight) {
            values["assistencenight." + userId] = checkdate;
        } else {
            values["assistence." + userId] = checkdate;
        }
        if (late) {
            values["late." + userId] = true;
        }
        // // console.log(userId, aid, values);

        db.collection("asignments")
            .doc(aid)
            .update(values)
            .then(function () {});

        db.collection("assistance_report")
            .add({
                added: timenow,
                branch: bid,
                day: day,
                uid: userId,
                position: position,
                isNight: isNight,
                late: late,
                pay: pay,
                checkdate: checkdate,
                aid: aid,
            })
            .then(function () {});
    }

    function falta(userId, aid, day, position, isNight) {
        // // console.log(userId, aid, day, position, isNight);
        faltaData = {
            userId: userId,
            aid: aid,
            day: day,
            position: position,
            isNight: isNight,
        };
        showModal = true;
        jQuery("#faltaModalScrollable").modal("show");
    }

    function regFalta() {
        // // console.log(faltaComment);
        var values = {};
        var branchName;
        // values["absences." + faltaData.userId] = true;

        var day = {};
        var night = {};
        // var values = {};
        if (faltaData.isNight == true) {
            values["absencesnight." + faltaData.userId] = true;
            night["absencesnight." + faltaData.userId] = true;
            // values["assistencenight." + editData.uid] = '';
        } else {
            values["absences." + faltaData.userId] = true;
            day[faltaData.userId] = modalworker;
            // values["assistence." + editData.uid] = '';
        }

        if (faltaComment == "") {
            Swal.fire({
                title: "Atención!",
                text: "Se guardará la falta sin un motivo!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
            });
        } else {
            if (branchName == undefined) {
                $branches.forEach((element) => {
                    if (element.id == bid) {
                        branchName = element.name;
                    }
                });

                $workers.forEach((element) => {
                    if (element.id == faltaData.userId) {
                        uName = element.name;
                        // // console.log(uName);
                    }
                });

                db.collection("asignments")
                    .doc(faltaData.aid)
                    .update(values)
                    .then(function () {});

                db.collection("workabsences").add({
                    added: new Date(),
                    branches: bid,
                    users: faltaData.userId,
                    day: faltaData.day,
                    positions: faltaData.position,
                });

                db.collection("adminnotifications").add({
                    added: new Date(),
                    branches: bid,
                    branchesName: branchName,
                    worker: faltaData.userId,
                    workerName: uName,
                    subject: faltaComment,
                    dayId: faltaData.aid,
                    absenceDate: faltaData.day,
                    read: false,
                    type: "Falta",
                });

                Swal.fire({
                    title: "Falta guardada!",
                    text: "Falta registrada correctamente!",
                    type: "success",
                    confirmButtonColor: "#34c38f",
                    cancelButtonColor: "#f46a6a",
                });
                jQuery("#faltaModalScrollable").modal("hide");
                // refreshWeek();
            }
        }
    }
    //Bbtiene los valores sobre que worker modificara
    async function edit(userId, aid, day, position, isNight) {
        // console.log('🚀 DEBUG ScheduleLog: edit - Usuario:', userId, 'aid:', aid, 'día:', day, 'posición:', position, 'noche:', isNight);
        
        // Verificar límite de guardias antes de permitir edición
        const canEdit = await checkShiftLimitBeforeEdit(position, () => true);
        if (!canEdit) {
            // console.log('🚫 DEBUG ScheduleLog: Edición bloqueada por límite de guardias');
            return;
        }
        
        // console.log('✅ DEBUG ScheduleLog: Procediendo con la edición');
        editData = {
            uid: userId,
            dayColl: aid,
            dayId: day,
            posid: position,
            isNight: isNight,
        };
        showModal = true;
        jQuery("#editModalScrollable").modal("show");
    }

    //Actualiza el workers dependiendo si es dia o noche
    function updateData() {
        var updateValue = {};
        var day = {};
        var night = {};
        // var values = {};
        if (editData.isNight == true) {
            updateValue["night." + editData.posid] = modalworker;
            night["night." + editData.posid] = modalworker;
            // values["assistencenight." + editData.uid] = '';
        } else {
            updateValue["day." + editData.posid] = modalworker;
            day[editData.posid] = modalworker;
            // values["assistence." + editData.uid] = '';
        }
        if (editData.dayColl != undefined) {
            //Se selecciona un documento de la collection en base al editData.dayColl
            // console.log("Select existing document from Asignments collection");
            db.collection("asignments")
                .doc(editData.dayColl)
                .update(updateValue)
                .then(function () {});
        } else {
            //Se crea un nuevo documento en la collection
            // console.log("Adding new document to Asignments collection");
            db.collection("asignments").add({
                added: new Date(),
                branches: bid,
                day,
                dayId: editData.dayId,
            });
        }

        // db.collection("asignments")
        //     .doc(editData.dayColl)
        //     .update(values)
        //     .then(function () {
        //     });
        jQuery("#editModalScrollable").modal("hide");
    }

    function deleteReg() {
        var updateValueDel = {};
        var updateTimeDel = {};
        var day = {};
        var night = {};
        // var values = {};
        if (editData.isNight == true) {
            updateValueDel["night." + editData.posid] = "";
            night["night." + editData.posid] = "";
            if ("assistencenight." + editData.uid) {
                updateTimeDel["assistencenight." + editData.uid] = "";
            }
            // values["assistencenight." + editData.uid] = '';
        } else {
            updateValueDel["day." + editData.posid] = "";
            day[editData.posid] = "";
            if ("assistence." + editData.uid) {
                updateTimeDel["assistence." + editData.uid] =
                    firebase.firestore.FieldValue.delete();
            }
            // values["assistence." + editData.uid] = '';
        }
        Swal.fire({
            title: "¿Esta seguro?",
            text: "Desea eliminar este registro",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Si, borrarlo!",
        }).then(function (result) {
            // console.log(result);
            if (result.value == true) {
                if (editData.dayColl != undefined) {
                    //Se selecciona un documento de la collection en base al editData.dayColl
                    // console.log("Deleting data from the position selected");
                    db.collection("asignments")
                        .doc(editData.dayColl)
                        .update(updateValueDel)
                        .then(function () {});
                    db.collection("asignments")
                        .doc(editData.dayColl)
                        .update(updateTimeDel)
                        .then(function () {});
                }
                Swal.fire({
                    title: "Registro Eliminado!",
                    text: "Se eliminó correctamente",
                    type: "success",
                    confirmButtonColor: "#34c38f",
                });
                jQuery("#editModalScrollable").modal("hide");
            }
        });
    }

    async function confirmAll(isNight, day, aId, user, comments) {
        // console.log(isNight, day, aId, user, comments);
        asignYesterday = 0;
        confYesterday = false;
        confYesterdayNight = false;
        let dayOfConfirm = DateTime.fromISO(day).setLocale("es-mx");
        let previousDay = dayOfConfirm.minus({ days: 1 }).toISODate();
        let snapshot = await db
            .collection("asignments")
            .where("dayId", "==", previousDay)
            .where("branches", "==", bid)
            .get();

        let snapSize = snapshot.docs.length;

        for (let doc of snapshot.docs) {
            asignYesterday = doc.data().dayId;
            confYesterday = doc.data().confirmDay;
            confYesterdayNight = doc.data().confirmNight;
        }

        if (confYesterday != true || confYesterdayNight != true) {
            Swal.fire({
                title: "Atención",
                text: "No se puede confirmar debido a que el día anterior no se ha confirmado",
                type: "warning",
                confirmButtonColor: "#34c38f",
            });
            return;
        }

        size = Object.values(user).filter(function (n) {
            if (n == "") {
                return false;
            }
            if (isNight) {
                if (
                    (posAsign[day].assistencenight == undefined ||
                        posAsign[day].assistencenight[n] == undefined) &&
                    (posAsign[day].absencesnight == undefined ||
                        posAsign[day].absencesnight[n] == undefined)
                ) {
                    return true;
                }
            } else {
                if (
                    (posAsign[day].assistence == undefined ||
                        posAsign[day].assistence[n] == undefined) &&
                    (posAsign[day].absences == undefined ||
                        posAsign[day].absences[n] == undefined)
                ) {
                    return true;
                }
            }

            return false;
        }).length;

        if (isNight == true) {
            if (posAsign[day].assistencenight) {
                assistants = posAsign[day].assistencenight;
                assisLenght = Object.entries(assistants).length;
                assisList = Object.keys(assistants);
            } else {
                assistants = 0;
            }
            if (posAsign[day].absencesnight) {
                absence = posAsign[day].absencesnight;
                absenceLenght = Object.entries(absence).length;
            } else {
                absenceLenght = 0;
            }
        } else {
            if (posAsign[day].assistence) {
                assistants = posAsign[day].assistence;
                assisLenght = Object.entries(assistants).length;
                assisList = Object.keys(assistants);
            } else {
                assisLenght = 0;
            }
            if (posAsign[day].absences) {
                absence = posAsign[day].absences;
                absenceLenght = Object.entries(absence).length;
            } else {
                absenceLenght = 0;
            }
        }

        if (aId == undefined) {
            Swal.fire({
                title: "Atención!",
                text: "No existen asignaciones por confirmar",
                type: "warning",
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
            });
            return;
        }

        let pos = {};
        let posId;
        let worposname = "";
        let worname = "";
        let worposid = "";
        let worposarray = "";
        let alertData = {};
        let datemodal = DateTime.fromISO(day).setLocale("es-mx");
        let newDateModal = datemodal.toLocaleString(DateTime.DATE_HUGE);

        Object.entries(user).forEach(([pId, userId]) => {
            for (let a = 0; a < assisList.length; a++) {
                const userIdCheckin = assisList[a];
                if (userId == userIdCheckin) {
                    workpositions.forEach((position) => {
                        if (position.id == pId) {
                            alertData[pId] = {
                                position: position.name,
                                name: "",
                            };
                            $workers.forEach((worker) => {
                                if (worker.id == userId) {
                                    alertData[pId].name += worker.name;
                                }
                            });
                        }
                    });
                }
            }
        });

        let compartidaWorkers = Object.values(alertData).filter((worker) =>
            worker.name.includes("Compartida")
        );

        if (compartidaWorkers.length > 0) {
            showCompartidaModal(compartidaWorkers, isNight, day, aId, user, comments);
            return;
        } else {
            await continueConfirmAll(isNight, day, aId, user, comments);
        }
    }

    async function continueConfirmAll(isNight, day, aId, user, comments) {
        let pos = {};
        let posId;
        let worposname = "";
        let worname = "";
        let worposid = "";
        let worposarray = "";
        let alertData = {};
        let datemodal = DateTime.fromISO(day).setLocale("es-mx");
        let newDateModal = datemodal.toLocaleString(DateTime.DATE_HUGE);

        let alertText = "";
        let alertTextEmpty = "";

        Object.keys(alertData).forEach((ek) => {
            if (alertData[ek].name == "") {
                alertTextEmpty +=
                    alertData[ek].position +
                    " : <b>" +
                    "Sin Asignar" +
                    "</b><br>";
            } else {
                alertText +=
                    alertData[ek].position +
                    " : " +
                    alertData[ek].name +
                    "<br>";
            }
        });

        if (size > 0) {
            await Swal.fire({
                title: "Atención!",
                text:
                    "Faltan " +
                    size +
                    " asignaciones por confirmar o marcar como falta",
                type: "warning",
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
            });
            return;
        }

        let result = await Swal.fire({
            title: "Revisa las Asignaciones!",
            html:
                "Puestos/Personal por confirmar: <br>Fecha: <b>" +
                newDateModal +
                "</b><br><br>" +
                alertText +
                "<br>" +
                alertTextEmpty +
                "<b>GUARDIAS COMPARTIDAS deberán agregarse antes de confirmar esta ventana.</b>",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Ok",
        });

        if (result.value == false || result.value == undefined) {
            return;
        }

        Object.entries(user).forEach(([pId, userId]) => {
            workpositions.forEach((position) => {
                pos = position.positions;
                posId = position.id;
                if (pId == posId) {
                    checkInAll(userId, aId, day, pos, 0, false, isNight);
                }
            });
        });

        var updateValue = {};
        var udpateComments = {};

        if (isNight == true) {
            updateValue["confirmNight"] = true;
            udpateComments["commentsNight"] = comments;
        } else {
            updateValue["confirmDay"] = true;
            udpateComments["commentsDay"] = comments;
        }

        db.collection("asignments")
            .doc(aId)
            .update(updateValue)
            .then(function () {});

        db.collection("asignments")
            .doc(aId)
            .update(udpateComments)
            .then(function () {});

        // Al final de continueConfirmAll, después de procesar todos los usuarios
        let sharedDoc = await db.collection("asignments").doc(aId).get();
        if (sharedDoc.exists) {
            let sharedData = sharedDoc.data();
            let sharedPrefix = isNight ? "sharedNight_" : "sharedDay_";
            let sharedFields = Object.keys(sharedData).filter(key => key.startsWith(sharedPrefix));

            for (let field of sharedFields) {
                let sharedArray = sharedData[field];
                if (Array.isArray(sharedArray) && sharedArray.length > 0) {
                    let positionId = field.replace(sharedPrefix, "");

                    // Buscar el workerId en los values de dayOrNightMap que tenga active_share: true y NO esté en sharedArray
                    let dayOrNightMap = isNight ? sharedData.night : sharedData.day;
                    
                    let assignedWorkerId = null;
                    if (dayOrNightMap) {
                        // Buscar en los values
                        for (let value of Object.values(dayOrNightMap)) {
                            // value puede ser string o array
                            if (typeof value === 'string') {
                                let worker = $workers.find(w => w.id === value && w.active_share && !sharedArray.includes(w.id));
                                if (worker) {
                                    assignedWorkerId = worker.id;
                                    break;
                                }
                            } else if (Array.isArray(value)) {
                                for (let v of value) {
                                    let worker = $workers.find(w => w.id === v && w.active_share && !sharedArray.includes(w.id));
                                    if (worker) {
                                        assignedWorkerId = worker.id;
                                        break;
                                    }
                                }
                                if (assignedWorkerId) break;
                            }
                        }
                    }
                    // console.log("assignedWorkerId (buscado en values):", assignedWorkerId);

                    // Buscar el worker con ese ID y active_share: true
                    let compartidaWorker = null;
                    if (assignedWorkerId) {
                        let worker = $workers.find(w => w.id === assignedWorkerId);
                        // console.log("worker encontrado:", worker);
                        if (worker && worker.active_share) {
                            compartidaWorker = worker;
                        }
                    }
                    // console.log("compartidaWorker:", compartidaWorker);

                    let sharedPay = 0;
                    if (compartidaWorker && compartidaWorker.options) {
                        // console.log("compartidaWorker.options:", compartidaWorker.options);
                        for (let opt of compartidaWorker.options) {
                            // console.log("Revisando option:", opt);
                            if (
                                opt.positions == positionId &&
                                opt.pay != null &&
                                opt.pay != "0" &&
                                opt.pay != undefined
                            ) {
                                sharedPay = Number(opt.pay);
                                // console.log("sharedPay encontrado en options:", sharedPay);
                                break;
                            }
                        }
                    }
                    // Fallback: si no se encontró el puesto en options, usar compartidaWorker.pay
                    if ((!sharedPay || sharedPay === 0) && compartidaWorker) {
                        sharedPay = compartidaWorker.pay ? Number(compartidaWorker.pay) : 0;
                        // console.log("sharedPay usando compartidaWorker.pay:", sharedPay);
                    }

                    let count = sharedArray.length;
                    let payPerWorker = sharedPay / count;
                    // console.log("payPerWorker:", payPerWorker);

                    // Genera un recibo SOLO para cada empleado del array de este puesto
                    for (let workerId of sharedArray) {
                        // console.log("Generando recibo para:", workerId, "con amount:", payPerWorker);
                        await db.collection("patientlog").add({
                            created: new Date(),
                            added: DateTime.fromISO(day).plus({ hours: 1 }).toJSDate(),
                            branch: bid,
                            createdBy: "pending",
                            uid: workerId,
                            positions: positionId,
                            type: 0,
                            units: 1,
                            amount: payPerWorker,
                            nightShift: isNight,
                            sharedShift: { [positionId]: sharedArray },
                            shared: true
                        });
                    }
                }
            }
        }
    }

    function showCompartidaModal(workers, night, date, documentId, positions, observations) {
        // console.log(night, date, documentId, positions, observations);
        compartidaQueue = [...workers]; // copia de los puestos compartidos
        compartidaResults = [];
        aId = documentId;
        isNight = night;
        day = date;
        user = positions;
        comments = observations;
        showNextCompartida();
    }

    function showNextCompartida() {
        if (compartidaQueue.length === 0) {
            // Ya no hay más, guardar y continuar
            saveAllCompartidas();
            continueConfirmAll(isNight, day, aId, user, comments);
            return;
        }
        currentCompartida = compartidaQueue.shift();
        // Inicializa los trabajadores seleccionados para este puesto
        selectedWorkers = [
            { name: '', id: generateId() }
        ];
        jQuery("#compartidaModal").modal("show");
    }

    // Función para confirmar la selección de trabajadores compartidos
    function confirmCompartida() {
        // ✅ VALIDACIÓN 1: Verificar que hay al menos 2 trabajadores
        const workersWithNames = selectedWorkers.filter(w => w.name && w.name.trim() !== '');
        
        if (workersWithNames.length < 2) {
            Swal.fire({
                title: "Error de Validación",
                text: "Una guardia compartida debe tener al menos 2 trabajadores asignados.",
                icon: "error",
                confirmButtonColor: "#f46a6a"
            });
            return;
        }
        
        // ✅ VALIDACIÓN 2: Verificar que no hay selectores vacíos
        const emptyWorkers = selectedWorkers.filter(w => !w.name || w.name.trim() === '');
        
        if (emptyWorkers.length > 0) {
            Swal.fire({
                title: "Error de Validación", 
                text: `Hay ${emptyWorkers.length} selector(es) sin asignar. Por favor, selecciona un trabajador para cada selector o elimínalo usando el botón de eliminar.`,
                icon: "error",
                confirmButtonColor: "#f46a6a"
            });
            return;
        }

    // Recopilar los valores seleccionados de los trabajadores (solo los que tienen nombre)
        // Guarda la selección para el puesto actual
        compartidaResults.push({
            position: currentCompartida.position,
            workers: workersWithNames.map(w => w.name)
        });

        // Mostrar el modal de confirmación con SweetAlert
        Swal.fire({
            title: "Confirmar Guardias Compartidas",
            html: `¿Deseas confirmar las guardias compartidas seleccionadas?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Confirmar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.value) {
                jQuery("#compartidaModal").modal("hide");
                setTimeout(() => {
                    showNextCompartida();
                }, 500);
            } else {
                // Permitir que el usuario siga editando si cancela
                // console.log("El usuario ha cancelado la confirmación.");
            }
        });
    }

    function saveAllCompartidas() {
        let updateValue = {};
        compartidaResults.forEach(result => {
            // Buscar el ID del puesto por nombre
            let positionId = "";
            for (let pos of $positions) {
                if (pos.name === result.position) {
                    positionId = pos.id;
                    // console.log("Puesto encontrado:", pos.name, "con ID:", positionId);
                    break;
                }
            }
            if (!positionId) {
                // Si no se encuentra, puedes omitir o mostrar un error
                console.warn("No se encontró el ID para el puesto:", result.position);
                return;
            }
            if (isNight) {
                updateValue[`sharedNight_${positionId}`] = result.workers;
            } else {
                updateValue[`sharedDay_${positionId}`] = result.workers;
            }
        });

        db.collection("asignments")
            .doc(aId)
            .update(updateValue)
            .then(() => {
                // console.log("Guardias compartidas actualizadas correctamente.");
            })
            .catch(error => {
                console.error("Error al actualizar guardias compartidas: ", error);
            });
    }

    // Función para guardar los datos de trabajadores compartidos en Firebase
    function saveCompartida() {
        // Crear el objeto de actualización para Firebase
        let updateValue = {};

        // Crear un arreglo de nombres de trabajadores
        let namesArray = selectedWorkers.map(worker => worker.name);

        // Actualizar el campo correcto en Firebase según isNight
        if (isNight) {
            updateValue["sharedNight"] = namesArray;
        } else {
            updateValue["sharedDay"] = namesArray;
        }

        // Actualizar el documento en Firebase
        db.collection("asignments")
            .doc(aId)
            .update(updateValue)
            .then(() => {
                // console.log("Trabajadores compartidos actualizados correctamente.");
            })
            .catch(error => {
                console.error("Error al actualizar trabajadores compartidos: ", error);
            });
    }

    // Genera un id único simple (puedes mejorar si quieres)
    function generateId() {
        return 'worker' + Math.random().toString(36).substr(2, 9);
    }

    function addWorker() {
        // console.log("Adding new worker");
        selectedWorkers = [...selectedWorkers, { id: generateId(), name: '' }];
        // console.log(selectedWorkers);
    }

    function removeWorker(index) {
        // ✅ VALIDACIÓN: No permitir eliminar si solo queda 1 selector
        if (selectedWorkers.length <= 1) {
            Swal.fire({
                title: "No se puede eliminar",
                text: "Debe mantener al menos un selector disponible para agregar trabajadores.",
                icon: "warning",
                confirmButtonColor: "#f46a6a"
            });
            return;
        }
        
        selectedWorkers = selectedWorkers.filter((_, i) => i !== index);
    }
</script>

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="col">
                        <h3>
                            Calendario <BranchesSearchList
                                value={bid}
                                inlist={true}
                            />
                        </h3>
                    </div>
                    <div class="col">
                        <h6>Residentes Actuales</h6>
                        <b>{residents}</b>
                    </div>
                    <div class="col"></div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="card">
    <div class="card-body">
        <div class="row mb-4">
            <div class="col finger-reader">
                {#if fingerReader == undefined}
                    <div class="reader-status">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            ><g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                ><path
                                    d="M7 16v-4.639c0-.51.1-.999.285-1.453M17 14v-1.185m-7.778-5.08A5.506 5.506 0 0 1 12 7c2.28 0 4.203 1.33 4.805 3.15M10 17v-2.177M14 17v-5.147C14 10.83 13.105 10 12 10s-2 .83-2 1.853v.794"
                                /><path
                                    d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10a9.98 9.98 0 0 1-.458 3m-4.421 7.364l2.122-2.121m0 0l2.121-2.122m-2.121 2.122L17.12 18.12m2.122 2.122l2.121 2.121"
                                /></g
                            ></svg
                        >

                        Desconectado
                    </div>
                    <button
                        class="btn btn-outline-secondary"
                        on:click={() => {
                            connectFinger();
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            ><g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                ><path
                                    d="M7 16v-4.639c0-.51.1-.999.285-1.453M17 16v-3.185m-7.778-5.08A5.506 5.506 0 0 1 12 7c2.28 0 4.203 1.33 4.805 3.15M10 17v-2.177M14 17v-5.147C14 10.83 13.105 10 12 10s-2 .83-2 1.853v.794"
                                /><path
                                    d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"
                                /></g
                            ></svg
                        >
                        Conectar
                    </button>
                {:else}
                    <div class="reader-status ok">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            ><g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                ><path
                                    d="M7 16v-4.639c0-.51.1-.999.285-1.453M17 16v-3.185m-7.778-5.08A5.506 5.506 0 0 1 12 7c2.28 0 4.203 1.33 4.805 3.15M10 17v-2.177M14 17v-5.147C14 10.83 13.105 10 12 10s-2 .83-2 1.853v.794"
                                /><path
                                    d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10a9.98 9.98 0 0 1-.458 3M15.5 20.5l2 2l5-5"
                                /></g
                            ></svg
                        >

                        Conectado
                    </div>
                    {#if !enrolling}
                        <button
                            class="btn btn-outline-secondary"
                            on:click={() => {
                                enrollFinger();
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                ><g
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    ><path
                                        d="M5.5 13.5V8.25A1.25 1.25 0 0 1 6.75 7h0A1.25 1.25 0 0 1 8 8.25V11h2a2 2 0 0 1 2 2v.5"
                                    /><path
                                        d="M3.39 8.61a4.75 4.75 0 1 1 6.72 0"
                                    /></g
                                ></svg
                            >
                            Registrar Empleado</button
                        >
                    {/if}
                    {#if !enrolling}
                        {#if candidates.length == 0}
                            No hay huellas registradas
                        {/if}
                    {:else}
                        <div class="enroll-form">
                            {#if selectedWorker == ""}
                                Selecciona un empleado
                            {:else if candidatesMap[selectedWorker]}
                                <span class="enroll-msg">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        ><g
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            ><path
                                                d="M5.5 13.5V8.25A1.25 1.25 0 0 1 6.75 7h0A1.25 1.25 0 0 1 8 8.25V11h2a2 2 0 0 1 2 2v.5"
                                            /><path
                                                d="M3.39 8.61a4.75 4.75 0 1 1 6.72 0"
                                            /></g
                                        ></svg
                                    >

                                    Modificar Huella: ponga el dedo en el lector
                                </span>
                            {:else}
                                <span class="enroll-msg add">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        ><g
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            ><path
                                                d="M5.5 13.5V8.25A1.25 1.25 0 0 1 6.75 7h0A1.25 1.25 0 0 1 8 8.25V11h2a2 2 0 0 1 2 2v.5"
                                            /><path
                                                d="M3.39 8.61a4.75 4.75 0 1 1 6.72 0"
                                            /></g
                                        ></svg
                                    >

                                    Registrar Huella: ponga el dedo en el lector
                                </span>
                            {/if}
                            <WorkersSearchListFiltered
                                bind:value={selectedWorker}
                                inlist={false}
                            />
                        </div>
                        <button
                            class="btn btn-outline-secondary"
                            on:click={() => {
                                stopEnroll();
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                ><path
                                    fill="currentColor"
                                    d="M3 16.74L7.76 12L3 7.26L7.26 3L12 7.76L16.74 3L21 7.26L16.24 12L21 16.74L16.74 21L12 16.24L7.26 21L3 16.74m9-3.33l4.74 4.75l1.42-1.42L13.41 12l4.75-4.74l-1.42-1.42L12 10.59L7.26 5.84L5.84 7.26L10.59 12l-4.75 4.74l1.42 1.42L12 13.41Z"
                                /></svg
                            >
                            Cancelar</button
                        >
                        <hr />
                    {/if}
                {/if}
            </div>
        </div>
        <div class="row mb-4">
            <div class="col"></div>
            <div class="col-5 text-center"><h3>Turno de Día</h3></div>
            <div class="col"></div>
        </div>

        <div class="row mb-4">
            <div class="col"></div>
            <div class="col-1">
                <a
                    href="javascript:void(0);"
                    class="btn btn-light waves-effect"
                    on:click={() => {
                        prevWeek();
                    }}
                    ><i class="bx bx-chevron-left font-size-16 align-middle"
                    ></i></a
                >
            </div>
            <div class="col-5">
                <h4>
                    Semana {weekNew[0].date.day} de {weekNew[0].date.monthLong} al
                    {weekNew[6].date.day} de {weekNew[6].date.monthLong}
                </h4>
            </div>
            <div class="col-1">
                <a
                    href="javascript:void(0);"
                    class="btn btn-light waves-effect"
                    on:click={() => {
                        nextWeek();
                    }}
                    ><i class="bx bx-chevron-right font-size-16 align-middle"
                    ></i></a
                >
            </div>
            <div class="col"></div>
        </div>

        <div class="timeline-count p-4 over">
            <!-- Timeline row Start -->
            <div class="row over">
                {#each weekNew as day}
                    <div class="timeline-box col-lg-3">
                        <div class="timeline-spacing">
                            <div
                                class="item-lable {today == day.date.toISODate()
                                    ? 'bg-primary'
                                    : 'bg-secondary'} rounded"
                            >
                                <p class="text-center text-white">
                                    {day.date.weekdayLong}
                                </p>
                            </div>
                            <div class="col">
                                <h6 class="text-center">
                                    {day.date.day}
                                    {day.date.monthLong}
                                </h6>
                            </div>
                            <div class="timeline-line active">
                                <div class="dot bg-primary"></div>
                            </div>
                            <div class="vertical-line">
                                <div class="wrapper-line bg-light"></div>
                            </div>
                            <div class="bg-light p-4 rounded card-assistance">
                                <div class="text-muted mb-0">
                                    {#each workpositions as position}
                                        <div class="row">
                                            <div class="col-9 position">
                                                <PositionsSearchList
                                                    value={position.positions}
                                                    inlist={true}
                                                    withStyle={false}
                                                />
                                            </div>
                                        </div>
                                        <div class="row mb-3">
                                            <div class="col-12">
                                                {#if posAsign[day.id].day[position.id] != null && posAsign[day.id].day[position.id] != undefined && posAsign[day.id].day[position.id] != ""}
                                                    {#if posAsign[day.id].absences == undefined || posAsign[day.id].absences[posAsign[day.id].day[position.id]] == undefined}
                                                        <WorkersSearchList
                                                            baseId={"-" +
                                                                position.id +
                                                                day.id +
                                                                "day"}
                                                            bind:value={posAsign[
                                                                day.id
                                                            ].day[position.id]}
                                                            excludeIds={day.asigned}
                                                            inlist={true}
                                                        />
                                                        {#if shiftLimitsReached[position.id] && position.positions === "ZUkMnvuKWrwbMJZIfgDS"}
                                                            <div class="alert alert-warning mt-2" style="margin-bottom: 0.75rem;">
                                                                <i class="bx bx-info-circle"></i> Límite mensual alcanzado - Se han considerado guardias adicionales por ingresos
                                                            </div>
                                                        {:else if shiftLimitsReached[position.id]}
                                                            <div class="alert alert-warning mt-2" style="margin-bottom: 0.75rem;">
                                                                <i class="bx bx-info-circle"></i> Límite mensual de guardias alcanzado
                                                            </div>
                                                        {/if}
                                                    {/if}
                                                    {#if true || today == day.date.toISODate()}
                                                        <!--
                                              {#if posAsign[day.id].assistence == undefined ||  posAsign[day.id].assistence[posAsign[day.id][position.id]] == undefined || posAsign[day.id].absences[posAsign[day.id][position.id]] == undefined || posAsign[day.id].absences == undefined}-->
                                                        {#if (posAsign[day.id].assistence == undefined || posAsign[day.id].assistence[posAsign[day.id].day[position.id]] == undefined) && (posAsign[day.id].absences == undefined || posAsign[day.id].absences[posAsign[day.id].day[position.id]] == undefined) && posAsign[day.id].confirmDay != true}
                                                            <!-- {#if today == day.date.toISODate()} -->
                                                            <div
                                                                class="botones botones-assistance"
                                                            >
                                                                <!-- <button
                                                                    type="button"
                                                                    class="btn btn-outline-danger waves-effect waves-light btn-assistance"
                                                                    on:click={() => {
                                                                        falta(
                                                                            posAsign[
                                                                                day
                                                                                    .id
                                                                            ]
                                                                                .day[
                                                                                position
                                                                                    .id
                                                                            ],
                                                                            posAsign[
                                                                                day
                                                                                    .id
                                                                            ]
                                                                                .aId,
                                                                            day.id,
                                                                            position.positions,
                                                                            false,
                                                                        );
                                                                    }}
                                                                    ><i
                                                                        class="bx bx-error-alt font-size-16 align-middle"
                                                                    ></i> Falta</button
                                                                > -->
                                                                <button
                                                                    type="button"
                                                                    class="btn btn-outline-warning waves-effect waves-light btn-assistance"
                                                                    on:click={() => {
                                                                        checkAssistance(
                                                                            posAsign[
                                                                                day
                                                                                    .id
                                                                            ]
                                                                                .day[
                                                                                position
                                                                                    .id
                                                                            ],
                                                                            posAsign[
                                                                                day
                                                                                    .id
                                                                            ]
                                                                                .aId,
                                                                            day.id,
                                                                            position.positions,
                                                                            position.pay,
                                                                            true,
                                                                            false,
                                                                        );
                                                                    }}
                                                                    ><i
                                                                        class="bx bx-check font-size-16 align-middle"
                                                                    ></i> Retardo</button
                                                                >
                                                                {#if $permissions.admin}
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-success waves-effect waves-light btn-assistance"
                                                                        on:click={() => {
                                                                            checkAssistance(
                                                                                posAsign[
                                                                                    day
                                                                                        .id
                                                                                ]
                                                                                    .day[
                                                                                    position
                                                                                        .id
                                                                                ],
                                                                                posAsign[
                                                                                    day
                                                                                        .id
                                                                                ]
                                                                                    .aId,
                                                                                day.id,
                                                                                position.positions,
                                                                                position.pay,
                                                                                false,
                                                                                false,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <i
                                                                            class="bx bx-check font-size-16 align-middle"
                                                                        ></i>
                                                                        Llegada
                                                                    </button>
                                                                {:else if day.id == today && active_scanner == true}
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-success waves-effect waves-light btn-assistance"
                                                                    >
                                                                        <!-- {#if candidatesMap[posAsign[day.id].day[position.id]] && day.id == today} on:click={() => { checkAssistance(posAsign[day.id].day[position.id], posAsign[day.id].aId, day.id, position.positions, position.pay, false, false)}} -->

                                                                        {#if candidatesMap[posAsign[day.id].day[position.id]] && day.id == today}
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="16"
                                                                                height="16"
                                                                                viewBox="0 0 24 24"
                                                                                ><g
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    stroke-linecap="round"
                                                                                    stroke-linejoin="round"
                                                                                    stroke-width="2"
                                                                                    ><path
                                                                                        d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6"
                                                                                    /><path
                                                                                        d="M12 11v2a14 14 0 0 0 2.5 8M8 15a18 18 0 0 0 1.8 6m-4.9-2a22 22 0 0 1-.9-7v-1a8 8 0 0 1 12-6.95"
                                                                                    /></g
                                                                                ></svg
                                                                            >
                                                                            Llegada
                                                                        {:else}
                                                                            Sin
                                                                            huella
                                                                            Registrada
                                                                        {/if}
                                                                    </button>
                                                                {/if}
                                                                {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-secondary waves-effect waves-light btn-assistance"
                                                                        disabled
                                                                        title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                        ><i
                                                                            class="bx bx-lock font-size-16 align-middle"
                                                                        ></i> Límite alcanzado</button
                                                                    >
                                                                {:else}
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-secondary waves-effect waves-light btn-assistance"
                                                                        on:click={() => {
                                                                            edit(
                                                                                posAsign[day.id].day[position.id],
                                                                                posAsign[day.id].aId,
                                                                                day.id,
                                                                                position.id,
                                                                                false,
                                                                            );
                                                                        }}
                                                                        ><i
                                                                            class="bx bx-edit-alt font-size-16 align-middle"
                                                                        ></i> Editar</button
                                                                    >
                                                                {/if}
                                                            </div>
                                                            <!-- {/if} -->
                                                        {:else}
                                                            <div
                                                                class="botones assistance"
                                                            >
                                                                {#if posAsign[day.id].assistence != undefined && posAsign[day.id].assistence[posAsign[day.id].day[position.id]] != undefined}
                                                                    <p>
                                                                        Hora: {posAsign[
                                                                            day
                                                                                .id
                                                                        ]
                                                                            .assistence[
                                                                            posAsign[
                                                                                day
                                                                                    .id
                                                                            ]
                                                                                .day[
                                                                                position
                                                                                    .id
                                                                            ]
                                                                        ]}
                                                                    </p>
                                                                    {#if posAsign[day.id].confirmDay != true}
                                                                        {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-secondary waves-effect waves-light"
                                                                                disabled
                                                                                title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                                ><i
                                                                                    class="bx bx-lock font-size-16 align-middle"
                                                                                ></i> Límite alcanzado</button
                                                                            >
                                                                        {:else}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-outline-secondary waves-effect waves-light"
                                                                                on:click={() => {
                                                                                    edit(
                                                                                        posAsign[day.id].day[position.id],
                                                                                        posAsign[day.id].aId,
                                                                                        day.id,
                                                                                        position.id,
                                                                                        false,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <i
                                                                                    class="bx bx-edit-alt font-size-16 align-middle"
                                                                                >
                                                                                </i>
                                                                                Editar
                                                                            </button>
                                                                        {/if}
                                                                    {/if}
                                                                {:else}
                                                                    <p
                                                                        style="color:red;"
                                                                    >
                                                                        FALTA
                                                                    </p>
                                                                    {#if posAsign[day.id].confirmDay != true}
                                                                        {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-secondary waves-effect waves-light"
                                                                                disabled
                                                                                title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                                ><i
                                                                                    class="bx bx-lock font-size-16 align-middle"
                                                                                ></i> Límite alcanzado</button
                                                                            >
                                                                        {:else}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-outline-secondary waves-effect waves-light"
                                                                                on:click={() => {
                                                                                    edit(
                                                                                        posAsign[day.id].day[position.id],
                                                                                        posAsign[day.id].aId,
                                                                                        day.id,
                                                                                        position.id,
                                                                                        false,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <i
                                                                                    class="bx bx-edit-alt font-size-16 align-middle"
                                                                                >
                                                                                </i>
                                                                                Editar
                                                                            </button>
                                                                        {/if}
                                                                    {/if}
                                                                {/if}
                                                            </div>
                                                        {/if}
                                                    {/if}
                                                {:else if posAsign[day.id].confirmDay != true}
                                                    <div class="no-assistance">
                                                        <p style="color:red;">
                                                            No asignado
                                                        </p>
                                                        {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                            <button
                                                                type="button"
                                                                class="btn btn-secondary waves-effect waves-light"
                                                                disabled
                                                                title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                ><i
                                                                    class="bx bx-lock font-size-16 align-middle"
                                                                ></i> Límite alcanzado</button
                                                            >
                                                        {:else}
                                                            <button
                                                                type="button"
                                                                class="btn btn-outline-secondary waves-effect waves-light"
                                                                on:click={() => {
                                                                    edit(
                                                                        posAsign[day.id].day[position.id],
                                                                        posAsign[day.id].aId,
                                                                        day.id,
                                                                        position.id,
                                                                        false,
                                                                    );
                                                                }}
                                                            >
                                                                <i
                                                                    class="bx bx-edit-alt font-size-16 align-middle"
                                                                >
                                                                </i> Editar
                                                            </button>
                                                        {/if}
                                                    </div>
                                                {:else}
                                                <div class="no-assistance">
                                                    <p style="color:red;">
                                                        No asignado
                                                    </p>
                                                    {#if $permissions.admin}
                                                        <button
                                                            type="button"
                                                            class="btn btn-outline-secondary waves-effect waves-light"
                                                            on:click={() => {
                                                                edit(
                                                                    posAsign[day.id].day[position.id],
                                                                    posAsign[day.id].aId,
                                                                    day.id,
                                                                    position.id,
                                                                    false,
                                                                );
                                                            }}
                                                        >
                                                            <i
                                                                class="bx bx-edit-alt font-size-16 align-middle"
                                                            >
                                                            </i> Editar
                                                        </button>
                                                    {/if}
                                                </div>
                                                {/if}
                                                <hr />
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                                <!-- {#if nightShift == '' || nightShift == undefined || nightShift == null} -->

                                <div class="">
                                    {#if posAsign[day.id].confirmDay == true}
                                        <div class="col-12">
                                            <p>OBSERVACIONES:</p>
                                            {#if posAsign[day.id].commentsDay == null || posAsign[day.id].commentsDay == ""}
                                                Sin Observaciones
                                            {:else}
                                                {#if typeof posAsign[day.id].commentsDay === 'object' && posAsign[day.id].commentsDay !== null}
                                                    <p>
                                                        {Object.values(
                                                            posAsign[day.id]
                                                                .commentsDay,
                                                        )}
                                                    </p>
                                                {:else}
                                                    <p>
                                                        {posAsign[day.id].commentsDay}
                                                    </p>
                                                {/if}
                                            {/if}
                                            Asistencia Confirmada
                                        </div>
                                    {:else}
                                        Anote sus observaciones
                                        <input
                                            class="form-control mb-1"
                                            type="text"
                                            bind:value={comments[day.id]}
                                        />
                                        <button
                                            type="button"
                                            class="btn btn-outline-success waves-effect waves-light btn-confirm"
                                            disabled={!$permissions.admin &&
                                                !validDays.includes(day.id)}
                                            on:click={() => {
                                                if (
                                                    posAsign[day.id] &&
                                                    posAsign[day.id].aId &&
                                                    posAsign[day.id].day
                                                ) {
                                                    confirmAll(
                                                        false,
                                                        day.id,
                                                        posAsign[day.id].aId,
                                                        posAsign[day.id].day,
                                                        comments[day.id] || ""
                                                    );
                                                } else {
                                                    swal(
                                                        "Error",
                                                        "No hay asignación para este día.",
                                                        "error"
                                                    );
                                                }
                                            }}
                                            >
                                            <i class="bx bx-check font-size-16 align-middle"></i> Confirmar Asistencias
                                        </button>
                                    {/if}
                                </div>
                                <!-- {/if} -->
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
            {#if nightShift != "" && nightShift != undefined && nightShift != null}
                <div class="row mb-4">
                    <div class="col"></div>
                    <div class="col-5 text-center"><h3>Turno de Noche</h3></div>
                    <div class="col"></div>
                </div>
                <div class="row over">
                    {#each weekNew as day}
                        <div class="timeline-box col-lg-3">
                            <div class="timeline-spacing">
                                <div
                                    class="bg-light p-4 rounded card-assistance"
                                >
                                    <div class="text-muted mb-0">
                                        {#each workpositions as position}
                                            {#if position.shift_night == "1"}
                                                <div class="row">
                                                    <div class="col-9">
                                                        <PositionsSearchList
                                                            value={position.positions}
                                                            inlist={true}
                                                            withStyle={false}
                                                        />
                                                    </div>
                                                </div>
                                                <div class="row mb-3">
                                                    <div class="col-12">
                                                        {#if posAsign[day.id].night[position.id] != null && posAsign[day.id].night[position.id] != undefined && posAsign[day.id].night[position.id] != ""}
                                                            {#if posAsign[day.id].absencesnight == undefined || posAsign[day.id].absencesnight[posAsign[day.id].night[position.id]] == undefined}
                                                                <WorkersSearchList
                                                                    baseId={"-" +
                                                                        position.id +
                                                                        day.id +
                                                                        "night"}
                                                                    bind:value={posAsign[
                                                                        day.id
                                                                    ].night[
                                                                        position
                                                                            .id
                                                                    ]}
                                                                    excludeIds={day.asigned}
                                                                    inlist={true}
                                                                />
                                                                {#if shiftLimitsReached[position.id] && position.positions === "ZUkMnvuKWrwbMJZIfgDS"}
                                                                    <div class="alert alert-warning mt-2" style="margin-bottom: 0.75rem;">
                                                                        <i class="bx bx-info-circle"></i> Límite mensual alcanzado - Se han considerado guardias adicionales por ingresos
                                                                    </div>
                                                                {:else if shiftLimitsReached[position.id]}
                                                                    <div class="alert alert-warning mt-2" style="margin-bottom: 0.75rem;">
                                                                        <i class="bx bx-info-circle"></i> Límite mensual de guardias alcanzado
                                                                    </div>
                                                                {/if}
                                                            {/if}
                                                            {#if true || today == day.date.toISODate() || nightdate == day.date.toISODate()}
                                                                <!-- blah ya no me dio la cabeza para mas, andaba poniendo esto: 
                                                                  {#if posAsign[day.id].assistence == undefined ||  posAsign[day.id].assistence[posAsign[day.id][position.id]] == undefined || posAsign[day.id].absences[posAsign[day.id][position.id]] == undefined || posAsign[day.id].absences == undefined}-->
                                                                {#if (posAsign[day.id].assistencenight == undefined || posAsign[day.id].assistencenight[posAsign[day.id].night[position.id]] == undefined) && (posAsign[day.id].absencesnight == undefined || posAsign[day.id].absencesnight[posAsign[day.id].night[position.id]] == undefined) && posAsign[day.id].confirmNight != true}
                                                                    <!-- {#if today == day.date.toISODate()  || nightdate == day.date.toISODate()} -->
                                                                    <div
                                                                        class="botones botones-assistance"
                                                                    >
                                                                        <!-- <button
                                                                            type="button"
                                                                            class="btn btn-outline-danger waves-effect waves-light"
                                                                            on:click={() => {
                                                                                falta(
                                                                                    posAsign[
                                                                                        day
                                                                                            .id
                                                                                    ]
                                                                                        .night[
                                                                                        position
                                                                                            .id
                                                                                    ],
                                                                                    posAsign[
                                                                                        day
                                                                                            .id
                                                                                    ]
                                                                                        .aId,
                                                                                    day.id,
                                                                                    position.positions,
                                                                                    true,
                                                                                );
                                                                            }}
                                                                            ><i
                                                                                class="bx bx-error-alt font-size-16 align-middle"

                                                                            ></i>
                                                                            Falta</button
                                                                        > -->
                                                                        <button
                                                                            type="button"
                                                                            class="btn btn-outline-warning waves-effect waves-light"
                                                                            on:click={() => {
                                                                                checkAssistance(
                                                                                    posAsign[
                                                                                        day
                                                                                            .id
                                                                                    ]
                                                                                        .night[
                                                                                        position
                                                                                            .id
                                                                                    ],
                                                                                    posAsign[
                                                                                        day
                                                                                            .id
                                                                                    ]
                                                                                        .aId,
                                                                                    day.id,
                                                                                    position.positions,
                                                                                    position.pay,
                                                                                    true,
                                                                                    true,
                                                                                );
                                                                            }}
                                                                            ><i
                                                                                class="bx bx-check font-size-16 align-middle"

                                                                            ></i>
                                                                            Retardo</button
                                                                        >
                                                                        {#if $permissions.admin}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-outline-success waves-effect waves-light btn-assistance"
                                                                                on:click={() => {
                                                                                    checkAssistance(
                                                                                        posAsign[
                                                                                            day
                                                                                                .id
                                                                                        ]
                                                                                            .night[
                                                                                            position
                                                                                                .id
                                                                                        ],
                                                                                        posAsign[
                                                                                            day
                                                                                                .id
                                                                                        ]
                                                                                            .aId,
                                                                                        day.id,
                                                                                        position.positions,
                                                                                        position.pay,
                                                                                        false,
                                                                                        true,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <i
                                                                                    class="bx bx-check font-size-16 align-middle"

                                                                                ></i>
                                                                                Llegada
                                                                            </button>
                                                                        {:else if day.id == today && active_scanner == true}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-outline-success waves-effect waves-light btn-assistance"
                                                                            >
                                                                                <!-- {#if candidatesMap[posAsign[day.id].day[position.id]] && day.id == today} on:click={() => {checkAssistance(posAsign[day.id].night[position.id], posAsign[day.id].aId, day.id, position.positions, position.pay, false, true)}} -->
                                                                                {#if candidatesMap[posAsign[day.id].night[position.id]] && day.id == today}
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="16"
                                                                                        height="16"
                                                                                        viewBox="0 0 24 24"
                                                                                        ><g
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            stroke-linecap="round"
                                                                                            stroke-linejoin="round"
                                                                                            stroke-width="2"
                                                                                            ><path
                                                                                                d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6"
                                                                                            /><path
                                                                                                d="M12 11v2a14 14 0 0 0 2.5 8M8 15a18 18 0 0 0 1.8 6m-4.9-2a22 22 0 0 1-.9-7v-1a8 8 0 0 1 12-6.95"
                                                                                            /></g
                                                                                        ></svg
                                                                                    >
                                                                                    Llegada
                                                                                {:else}
                                                                                    Sin
                                                                                    huella
                                                                                    Registrada
                                                                                {/if}
                                                                            </button>
                                                                        {/if}
                                                                        {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-secondary waves-effect waves-light"
                                                                                disabled
                                                                                title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                                ><i
                                                                                    class="bx bx-lock font-size-16 align-middle"
                                                                                ></i> Límite alcanzado</button
                                                                            >
                                                                        {:else}
                                                                            <button
                                                                                type="button"
                                                                                class="btn btn-outline-secondary waves-effect waves-light"
                                                                                on:click={() => {
                                                                                    edit(
                                                                                        posAsign[day.id].night[position.id],
                                                                                        posAsign[day.id].aId,
                                                                                        day.id,
                                                                                        position.id,
                                                                                        true,
                                                                                    );
                                                                                }}
                                                                                ><i
                                                                                    class="bx bx-edit-alt font-size-16 align-middle"

                                                                                ></i>
                                                                                Editar</button
                                                                            >
                                                                        {/if}
                                                                    </div>
                                                                    <!-- {/if} -->
                                                                {:else}
                                                                    <div
                                                                        class="botones assistance"
                                                                    >
                                                                        {#if posAsign[day.id].assistencenight != undefined && posAsign[day.id].assistencenight[posAsign[day.id].night[position.id]] != undefined}
                                                                            <p>
                                                                                Hora:
                                                                                {posAsign[
                                                                                    day
                                                                                        .id
                                                                                ]
                                                                                    .assistencenight[
                                                                                    posAsign[
                                                                                        day
                                                                                            .id
                                                                                    ]
                                                                                        .night[
                                                                                        position
                                                                                            .id
                                                                                    ]
                                                                                ]}
                                                                            </p>
                                                                            {#if posAsign[day.id].confirmNight != true}
                                                                                {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                                    <button
                                                                                        type="button"
                                                                                        class="btn btn-secondary waves-effect waves-light"
                                                                                        disabled
                                                                                        title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                                        ><i
                                                                                            class="bx bx-lock font-size-16 align-middle"
                                                                                        ></i> Límite alcanzado</button
                                                                                    >
                                                                                {:else}
                                                                                    <button
                                                                                        type="button"
                                                                                        class="btn btn-outline-secondary waves-effect waves-light"
                                                                                        on:click={() => {
                                                                                            edit(
                                                                                                posAsign[day.id].day[position.id],
                                                                                                posAsign[day.id].aId,
                                                                                                day.id,
                                                                                                position.id,
                                                                                                true,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <i
                                                                                            class="bx bx-edit-alt font-size-16 align-middle"
                                                                                        >
                                                                                        </i>
                                                                                        Editar
                                                                                    </button>
                                                                                {/if}
                                                                            {/if}
                                                                        {:else}
                                                                            <p
                                                                                style="color:red;"
                                                                            >
                                                                                FALTA
                                                                            </p>
                                                                            {#if posAsign[day.id].confirmDay != true}
                                                                                {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                                    <button
                                                                                        type="button"
                                                                                        class="btn btn-secondary waves-effect waves-light"
                                                                                        disabled
                                                                                        title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                                        ><i
                                                                                            class="bx bx-lock font-size-16 align-middle"
                                                                                        ></i> Límite alcanzado</button
                                                                                    >
                                                                                {:else}
                                                                                    <button
                                                                                        type="button"
                                                                                        class="btn btn-outline-secondary waves-effect waves-light"
                                                                                        on:click={() => {
                                                                                            edit(
                                                                                                posAsign[day.id].day[position.id],
                                                                                                posAsign[day.id].aId,
                                                                                                day.id,
                                                                                                position.id,
                                                                                                false,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <i
                                                                                            class="bx bx-edit-alt font-size-16 align-middle"
                                                                                        >
                                                                                        </i>
                                                                                        Editar
                                                                                    </button>
                                                                                {/if}
                                                                            {/if}
                                                                        {/if}
                                                                    </div>
                                                                {/if}
                                                            {/if}
                                                        {:else if posAsign[day.id].confirmNight != true}
                                                            <div
                                                                class="no-assistance"
                                                            >
                                                                <p
                                                                    style="color:red;"
                                                                >
                                                                    No asignado
                                                                </p>
                                                                {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-secondary waves-effect waves-light"
                                                                        disabled
                                                                        title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar"
                                                                        ><i
                                                                            class="bx bx-lock font-size-16 align-middle"
                                                                        ></i> Límite alcanzado</button
                                                                    >
                                                                {:else}
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-secondary waves-effect waves-light"
                                                                        on:click={() => {
                                                                            edit(
                                                                                posAsign[day.id].day[position.id],
                                                                                posAsign[day.id].aId,
                                                                                day.id,
                                                                                position.id,
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <i
                                                                            class="bx bx-edit-alt font-size-16 align-middle"
                                                                        >
                                                                        </i> Editar
                                                                    </button>
                                                                {/if}
                                                            </div>
                                                        {:else}
                                                            <div
                                                                class="no-assistance"
                                                            >
                                                                <p
                                                                    style="color:red;"
                                                                >
                                                                    No asignado
                                                                </p>
                                                                {#if $permissions.admin}
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-secondary waves-effect waves-light"
                                                                        on:click={() => {
                                                                            edit(
                                                                                posAsign[day.id].day[position.id],
                                                                                posAsign[day.id].aId,
                                                                                day.id,
                                                                                position.id,
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <i
                                                                            class="bx bx-edit-alt font-size-16 align-middle"
                                                                        >
                                                                        </i> Editar
                                                                    </button>
                                                                {/if}
                                                            </div>
                                                        {/if}
                                                        <hr />
                                                    </div>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                    <div class="">
                                        {#if posAsign[day.id].confirmNight == true}
                                            <div class="col-12">
                                                <p>OBSERVACIONES:</p>
                                                {#if posAsign[day.id].commentsNight == null || posAsign[day.id].commentsNight == ""}
                                                    Sin Observaciones
                                                {:else}
                                                    {#if typeof posAsign[day.id].commentsNight === 'object' && posAsign[day.id].commentsNight !== null}
                                                        <p>
                                                            {Object.values(
                                                                posAsign[day.id]
                                                                    .commentsNight,
                                                            )}
                                                        </p>
                                                    {:else}
                                                        <p>
                                                            {posAsign[day.id].commentsNight}
                                                        </p>
                                                    {/if}
                                                {/if}
                                                Asistencia Confirmada
                                            </div>
                                        {:else}
                                            Anote sus observaciones
                                            <input
                                                class="form-control"
                                                type="text"
                                                bind:value={commentsNight[day.id]}
                                            />
                                            <button
                                                type="button"
                                                class="btn btn-outline-success btn-confirm waves-effect waves-light"
                                                disabled={!$permissions.admin &&
                                                    !validDays.includes(day.id)}
                                                on:click={() => {
                                                    if (
                                                        posAsign[day.id] &&
                                                        posAsign[day.id].aId &&
                                                        posAsign[day.id].night
                                                    ) {
                                                        confirmAll(
                                                            true,
                                                            day.id,
                                                            posAsign[day.id].aId,
                                                            posAsign[day.id].night,
                                                            commentsNight[day.id] || ""
                                                        );
                                                    } else {
                                                        swal(
                                                            "Error",
                                                            "No hay asignación para este turno de noche.",
                                                            "error"
                                                        );
                                                    }
                                                }}
                                                ><i
                                                    class="bx bx-check font-size-16 align-middle"
                                                ></i> Confirmar Asistencias</button
                                            >
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- /.modal-edición -->
<div
    class="modal fade"
    id="editModalScrollable"
    tabindex="-1"
    role="dialog"
    aria-labelledby="editModalScrollableTitle"
    aria-hidden="true"
>
    <div
        class="modal-dialog modal-dialog-scrollable"
    >
        <div
            class="modal-content"
            style="overflow-y: scroll;"
        >
            <div
                class="modal-header"
            >
                <h5
                    class="modal-title mt-0"
                    id="editModalScrollableTitle"
                >
                    Selecciona al suplente
                </h5>
                <button
                    type="button"
                    class="close"
                    on:click={() => {
                        editData =
                            {};
                        jQuery(
                            "#editModalScrollable",
                        ).modal(
                            "hide",
                        );
                        showModal = false;
                    }}
                    aria-label="Close"
                >
                    <span
                        aria-hidden="true"
                        >&times;</span
                    >
                </button>
            </div>
            {#if showModal}
                <div
                    class="row search mb-2"
                >
                    <div
                        class="col-12"
                    >
                        <WorkersSearchListFiltered
                            baseId={"modal"}
                            bind:value={modalworker}
                        />
                    </div>
                </div>
            {/if}
            <div
                class="row modal-footer"
                style="height: 80px"
            >
                <div class="col-12">
                    <div
                        class="card"
                    >
                        <div
                            class="card-body"
                        >
                            <button
                                on:click={updateData}
                                class="btn btn-primary waves-effect waves-light"
                            >
                                {#if loading}
                                    <i
                                        class="bx bx-loader bx-spin font-size-16 align-middle mr-2"

                                    ></i>
                                {/if}
                                Guardar</button
                            >
                            {#if loading}
                                <div
                                    class="spinner-grow text-secondary m-1"
                                    role="status"
                                >
                                    <span
                                        class="sr-only"
                                        >Guardando...</span
                                    >
                                </div>
                            {/if}
                            <button
                                on:click={() => {
                                    editData =
                                        {};
                                    jQuery(
                                        "#editModalScrollable",
                                    ).modal(
                                        "hide",
                                    );
                                    showModal = false;
                                }}
                                class="btn btn-light waves-effect waves-light"
                                disabled={loading}
                            >
                                Cancelar</button
                            >
                            <button
                                on:click={deleteReg}
                                class="btn btn-danger waves-effect waves-light"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>

<!-- /.modal-compartidas -->
<div
    id="compartidaModal"
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
>
    <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content" style="overflow-y: scroll;">
            <div class="modal-header">
                <h5 class="modal-title">
                    Seleccionar Trabajadores Compartidos para {currentCompartida?.position}
                </h5>
                <button
                    type="button"
                    class="close"
                    data-dismiss="modal"
                    aria-label="Close"
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div id="workersContainer" class="container-fluid">
                    <!-- Selectores de trabajadores compartidos -->
                    {#each selectedWorkers as worker, index (worker.id)}
                        <div class="row mb-2 align-items-center">
                            <div class="col">
                                <WorkersSearchListFiltered
                                    bind:value={worker.name}
                                    inlist={false}
                                    class="w-100"
                                    baseId={worker.id}
                                />
                            </div>
                            {#if index > 0}
                                <div class="col-auto">
                                    <button
                                        type="button"
                                        class="btn btn-danger"
                                        on:click={() => removeWorker(index)}
                                    >
                                        -
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                    <div class="row">
                        <div class="col">
                            <button
                                type="button"
                                class="btn btn-primary w-100"
                                on:click={addWorker}
                            >
                                Agregar Empleado(a)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-secondary"
                    data-dismiss="modal"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    class="btn btn-primary"
                    on:click={confirmCompartida}
                >
                    Confirmar
                </button>
            </div>
        </div>
    </div>
</div>
<!-- /.modal-dialog -->

<div
    class="modal fade"
    id="faltaModalScrollable"
    tabindex="-1"
    role="dialog"
    aria-labelledby="editModalScrollableTitle"
    aria-hidden="true"
>
    <div
        class="modal-dialog modal-dialog-scrollable"
    >
        <div
            class="modal-content"
            style="overflow-y: scroll;"
        >
            <div
                class="modal-header"
            >
                <h5
                    class="modal-title mt-0"
                    id="faltaModalScrollableTitle"
                >
                    Registra motivo
                    de Falta
                </h5>
                <button
                    type="button"
                    class="close"
                    on:click={() => {
                        editData =
                            {};
                        jQuery(
                            "#faltaModalScrollable",
                        ).modal(
                            "hide",
                        );
                        showModal = false;
                    }}
                    aria-label="Close"
                >
                    <span
                        aria-hidden="true"
                        >&times;</span
                    >
                </button>
            </div>
            {#if showModal}
                <div
                    class="row search mb-2"
                >
                    <div
                        class="col-12"
                    >
                        <input
                            class="form-control"
                            type="text"
                            bind:value={faltaComment}
                        />
                        <!-- <WorkersSearchListFiltered baseId={"modal"} bind:value={modalworker}/> -->
                    </div>
                </div>
            {/if}
            <div
                class="row modal-footer"
                style="height: 80px"
            >
                <div class="col-12">
                    <div
                        class="card"
                    >
                        <div
                            class="card-body"
                        >
                            <button
                                on:click={regFalta}
                                class="btn btn-primary waves-effect waves-light"
                            >
                                {#if loading}
                                    <i
                                        class="bx bx-loader bx-spin font-size-16 align-middle mr-2"

                                    ></i>
                                {/if}
                                Guardar</button
                            >
                            {#if loading}
                                <div
                                    class="spinner-grow text-secondary m-1"
                                    role="status"
                                >
                                    <span
                                        class="sr-only"
                                        >Guardando...</span
                                    >
                                </div>
                            {/if}
                            <button
                                on:click={() => {
                                    editData =
                                        {};
                                    jQuery(
                                        "#faltaModalScrollable",
                                    ).modal(
                                        "hide",
                                    );
                                    showModal = false;
                                }}
                                class="btn btn-light waves-effect waves-light"
                                disabled={loading}
                            >
                                Cancelar</button
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
<style>
    .botones {
        display: flex;
        align-items: center;
    }
    .btn-outline-success {
        padding: 1px;
        font-size: 12px;
    }
    .btn-outline-danger {
        padding: 1px;
        font-size: 12px;
    }
    .btn-outline-warning {
        padding: 1px;
        font-size: 12px;
    }
    .timeline-count {
        overflow-x: auto !important;
        content: none;
    }
    .row.over {
        flex-wrap: nowrap;
    }
    .row.search {
        padding-left: 20px !important;
        padding-right: 20px !important;
    }
    .bg-light.p-4.rounded.mx-1 {
        padding: 0.5rem !important;
    }
    .mb-3,
    .my-3 {
        margin-bottom: 0.1rem !important;
    }
    .worker-selector {
        flex: 1 1 auto;
    }

    .add-worker-btn {
        margin-left: 10px;
    }

    .fixed-size-button {
        width: 40px;
        height: 40px;
    }
    
    /* Estilos para alertas de límites */
    .alert-warning {
        background-color: #fff3cd;
        border-color: #ffeaa7;
        color: #856404;
        border-radius: 0.25rem;
        border: 1px solid;
        margin-bottom: 0.75rem;
        padding: 0.5rem;
        font-size: 0.75rem;
        line-height: 1.2;
    }
    .alert-warning i {
        margin-right: 5px;
        font-size: 0.8rem;
    }
    
    /* Mejorar el espacio entre elementos */
    .card-assistance .row.mb-3 {
        margin-bottom: 0.5rem !important;
    }
    
    /* Asegurar que los botones no se empalmen */
    .botones-assistance .btn {
        margin-right: 5px;
        margin-bottom: 2px;
    }
    /* Deshabilitar selector visualmente */
    .worker-selector-disabled {
        pointer-events: none;
        opacity: 0.6;
        position: relative;
    }
    
    .worker-selector-disabled::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: transparent;
        z-index: 10;
        cursor: not-allowed;
    }
</style>
