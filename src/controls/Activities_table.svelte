<script>
    import { fbuser } from "../stores.js";
    import swal from "sweetalert";
    import WorkersSearchList from "./WorkersSearchList.svelte";
    import { permissions} from "../stores.js";

    export let uId; 
    export let params = {};
    export let values = {};
    export let tempId = uId;
    export let positionName = ""; // Nombre del puesto para mostrar
    export let cleaningNumber = null; // Número específico de limpieza (1, 2, 3, etc.)
    export let showUnassigned = false; // Si debe mostrar actividades sin cleaningNumber
    //0 = all
    //1 = activities
    //2 = meds
    export let view = 0;
    import Modal from './Modal.svelte';

    let showModal = false;
    let selectedActivities = [];
    let selectedActivityId = "";
    
    let activities = [];
    let patient = {};
    let group = {};
    
    let empty;
    let lenght;
    let today = DateTime.local()
            .setLocale("es-mx");
    let query;
    let time = today.toISOTime();

    if (!tempId) {
        console.log("Error! No hay un paciente seleccionado");
    } else if (uId == "limpieza" || uId.startsWith("limpieza-")) {
        // Determinar el nombre a mostrar
        if (positionName) {
            patient.name = positionName;
        } else {
            patient.name = "Limpieza";
        }
        
        // No necesitamos searchGroup ya que vamos a filtrar por cleaningNumber
        console.log("Configurando tarjeta de limpieza:", {
            uId,
            cleaningNumber,
            showUnassigned,
            positionName
        });
        
        // Escucha reactiva de la asignación de limpieza - usar "limpieza" como grupo base
        let searchGroup = "limpieza";
        if (cleaningNumber !== null) {
            searchGroup = "limpieza-" + cleaningNumber;
        }
        
        db.collection("patient_user")
            .where("group", "==", searchGroup)
            .where("dayId", "==", today.toISODate())
            .onSnapshot((snap) => {
                if (snap.size > 0) {
                    const workerData = snap.docs[0].data();
                    const workerId = workerData.workers;
                    if (!workerId) {
                        group = {};
                        return;
                    }
                    db.collection("workers").doc(workerId).onSnapshot((workerSnap) => {
                        if (workerSnap.exists) {
                            const workerDetails = workerSnap.data(); 
                            group = {
                                ...workerData,
                                id: snap.docs[0].id,
                                workerDetails: {
                                    name: workerDetails.name ?? "No disponible",
                                    phone: workerDetails.phone ?? "No disponible"
                                }
                            };
                        } else {
                            group = {};
                        }
                    }, (error) => {
                        group = {};
                    });
                } else {
                    group = {};
                }
            }, (error) => {
                group = {};
            });
    } else if (uId == "lavanderia") {
        patient.name = "Lavanderia";
    } else {
        db.collection("patients")
            .doc(tempId)
            .get()
            .then((snap) => {
                if (snap.exists) {
                    patient = snap.data();
                    if (patient.workers !== undefined) {
                        db.collection("patient_user")
                            .where("group", "==", patient.workers)
                            .where("dayId", "==", today.toISODate())
                            .onSnapshot((snap) => {
                                if (snap.size > 0) {
                                    const workerData = snap.docs[0].data();
                                    const workerId = workerData.workers;
                                    if (!workerId) {
                                        group = {};
                                        return;
                                    }
                                    db.collection("workers").doc(workerId).onSnapshot((workerSnap) => {
                                        if (workerSnap.exists) {
                                            const workerDetails = workerSnap.data();
                                            group = {
                                                ...workerData,
                                                id: snap.docs[0].id,
                                                workerDetails: {
                                                    name: workerDetails.name ?? "No disponible",
                                                    phone: workerDetails.phone ?? "No disponible"
                                                }
                                            };
                                        } else {
                                            group = {};
                                        }
                                    }, (error) => {
                                        group = {};
                                    });
                                } else {
                                    group = {};
                                }
                            }, (error) => {
                                group = {};
                            });
                    }
                }
            });
    }
    
    // Modificar la consulta de actividades según el tipo de uId
    let patientQuery = tempId;
    
    if (uId == "limpieza" || uId.startsWith("limpieza-") || uId == "limpieza-general") {
        // Para todas las actividades de limpieza, usar "limpieza" como patient
        patientQuery = "limpieza";
    }
    
    query = db.collection("cardActivities")
    .where('patient', "==", patientQuery)
    .where('dayId', "==", today.toISODate())
    .orderBy('time', 'asc')
    .onSnapshot((result) => {
        activities = [];
        result.forEach((doc) => {
            const tempactivity = doc.data();
            tempactivity.id = doc.id;
            
            // Filtrar actividades de limpieza basado en cleaningNumber
            if (patientQuery === "limpieza") {
                if (showUnassigned) {
                    // Mostrar solo actividades sin cleaningNumber (actividades legacy)
                    if (!tempactivity.cleaningNumber) {
                        activities.push(tempactivity);
                    }
                } else if (cleaningNumber !== null) {
                    // Mostrar solo actividades con el cleaningNumber específico
                    if (tempactivity.cleaningNumber === cleaningNumber) {
                        activities.push(tempactivity);
                    }
                    // También mostrar actividades sin cleaningNumber en todas las tarjetas (como fallback)
                    else if (!tempactivity.cleaningNumber) {
                        activities.push(tempactivity);
                    }
                } else {
                    // Mostrar todas las actividades de limpieza (caso por defecto)
                    activities.push(tempactivity);
                }
            } else {
                // Para otros casos (pacientes), agregar todas las actividades
                activities.push(tempactivity);
            }
            
            lenght = activities.length;
        }); 
        activities = activities;
        // console.log(activities);
    });

    function completeAll() {
        activities.forEach(act => {
            if (view == 0 || (view == 2 && act.prescription != '' && act.prescription != undefined) || (view == 1 && act.prescription == '')) {
                done(act.id, act.prescription, act.time);
            }
            if (view == 1) {
                doneOutOfBranch(act.id, act.prescription, act.time);
            }
        });
    }

    function done(aId, prescription, activityTime) {
        const now = new Date();
        const activityDateTime = new Date(`${today.toISODate()}T${activityTime}`);

        const oneHourBefore = new Date(activityDateTime);
        oneHourBefore.setHours(oneHourBefore.getHours() - 1);

        const oneHourAfter = new Date(activityDateTime);
        oneHourAfter.setHours(oneHourAfter.getHours() + 1);

        let isOutOfSchedule = false;

        if (now < oneHourBefore || now > oneHourAfter) {
            isOutOfSchedule = true;
            // alert(`Actividad marcada fuera de horario.\nHora actual: ${now.toLocaleTimeString()}\nHora programada: ${activityTime}`);
            // Usando SweetAlert2 para mostrar la alerta
            Swal.fire({
                title: "Actividad fuera de horario",
                text: `La actividad se marcó fuera de horario.\nHora actual: ${now.toLocaleTimeString()}\nHora programada: ${activityTime}`,
                icon: "warning",
                confirmButtonText: "Entendido",
            });
        }

        console.log("done", aId, isOutOfSchedule ? "(fuera de horario)" : "(en horario)");

        db.collection("cardActivities")
        .doc(aId)
        .update({
            checkActivity: true,
            checkDate: now,
            checkby: $fbuser.uid,
            checkName: $fbuser.displayName ?? '',
            outOfSchedule: isOutOfSchedule
        });

        if (prescription != undefined && prescription != "") {
            db.collection("prescriptions")
            .doc(prescription)
            .update({ inventory: firebase.firestore.FieldValue.increment(-1) });
        }
    }

    function doneOutOfBranch(aId, prescription) {
        Swal.fire({
            title: "Paciente fuera de Estancia",
            text: `¿Está seguro de que desea marcar al paciente como fuera de Estancia?`,
            icon: "warning",
            showCancelButton: true, // Agregar botón de cancelación
            confirmButtonText: "Sí, confirmar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            console.log(result);
            if (result) {
                const now = new Date();
                const isOutOfBranch = true; // Siempre se marca como "fuera de la estancia"

                console.log("doneOutOfBranch", aId, "(fuera de la estancia)");

                // Actualización en Firebase
                db.collection("cardActivities")
                    .doc(aId)
                    .update({
                        checkActivity: true,
                        checkDate: now,
                        checkby: $fbuser.uid,
                        checkName: $fbuser.displayName ?? '',
                        outOfBranch: isOutOfBranch // Se agrega el nuevo valor
                    });

                if (prescription != undefined && prescription != "") {
                    db.collection("prescriptions")
                        .doc(prescription)
                        .update({ inventory: firebase.firestore.FieldValue.increment(-1) });
                }

                Swal.fire({
                    title: "Marcado exitoso",
                    text: `La actividad se marcó como fuera de Estancia.`,
                    icon: "success",
                    confirmButtonText: "Entendido",
                });
            } else {
                console.log("El usuario canceló la operación.");
            }
        });
    }
    // console.log(view);

    function isWithinAllowedTime(activityTime) {
        const now = DateTime.local();
        const activityDateTime = DateTime.fromISO(activityTime);

        // Calcular el rango permitido
        const oneHourBefore = activityDateTime.minus({ hours: 1 });
        const twoHoursAfter = activityDateTime.plus({ hours: 2 });

        // Verificar si la hora actual está dentro del rango permitido
        return now >= oneHourBefore && now <= twoHoursAfter;
    }

    function handleCheckClick(event, activity) {
        const isAllowed = isWithinAllowedTime(activity.time);

        if (!isAllowed) {
            // Prevenir que el checkbox cambie su estado
            event.preventDefault();

            // Mostrar alerta con SweetAlert2
            Swal.fire({
                title: "Acción no permitida",
                text: `No puedes marcar esta actividad como hecha fuera del horario permitido.`,
                icon: "warning",
                confirmButtonText: "Entendido",
            });
        } else {
            // Si está permitido, llama a la función `done`
            if (activity.type === 1) {
                // Si es una actividad de limpieza, abrir el modal con sus subactividades
                event.preventDefault(); // Evitamos que el checkbox cambie
                selectedActivities = activity.cleaningDetails || []; // Cargamos las subactividades
                selectedActivityId = activity.id; // Establecer el ID de la actividad
                showModal = true;
            } else {
                // Si no es de limpieza, marcarla como hecha normalmente
                done(activity.id, activity.prescription, activity.time);
            }
        }
    }

    function openModal(activity) {
        selectedActivities = activity.activities || [];
        selectedActivityId = activity.id;
        showModal = true;
    }

    function closeModal() {
        showModal = false;
    }

    // function markActivityDone(activity) {
    //     activity.checkActivity = true;
    // }

    function markActivityDone(activity) {
        activity.checkActivity = true;
        
        // Si todas las actividades están completas, cerrar el modal
        if (selectedActivities.every(act => act.checkActivity)) {
            showModal = false;
        }
    }

    function markSubActivityComplete(subActivity) {
      // Aquí puedes actualizar el estado de la subactividad en Firebase si es necesario
      subActivity.completed = !subActivity.completed;
  }

    // Función para obtener la hora de un timestamp o un mensaje por defecto
    function getCheckTime(checkDate) {
        if (!checkDate) {
            return "Sin Marcar";
        }

        if (checkDate.seconds !== undefined && checkDate.nanoseconds !== undefined) {
            const timestamp = checkDate.seconds * 1000 + Math.floor(checkDate.nanoseconds / 1000000);
            return DateTime.fromMillis(timestamp).toFormat("HH:mm");
        }

        const timestamp = typeof checkDate === "string" ? parseFloat(checkDate) : checkDate;

        if (isNaN(timestamp)) {
            console.error(`Invalid timestamp: ${checkDate}`);
            return "Sin Marcar";
        }

        return DateTime.fromMillis(timestamp).toFormat("HH:mm");
    }
</script>

<div class="card-full">
    <div class="patient">
        <div class="row">
            <div class="col-6"><h5>{patient?.name ?? ''}</h5></div>
            <div class="col-6 right">
                <b>{group.responsable ?? ''}</b>
            </div>
            <!-- Mostrar datos del trabajador solo si está asignado hoy -->
            {#if group.workerDetails && group.workerDetails.name && group.workerDetails.name !== 'No disponible'}
                <div class="col-6"><b>Trabajador:</b> {group.workerDetails.name}</div>
                <div class="col-6"><b>Contacto:</b> {group.workerDetails.phone ?? 'No disponible'}</div>
            {:else}
                <div class="col-6"><b>Trabajador:</b> <span class="text-danger">No asignado</span></div>
                <div class="col-6"><b>Contacto:</b> <span class="text-danger">No disponible</span></div>
            {/if}
            <div class="col-6 right">
                <b>{group.name ?? ''}</b>
            </div>
        </div>
        <div class="row">
            <div class="col-6"><small>{today.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</small></div>
            {#if view == 2}
                <div class="col-6 right">
                    <a href="javascript:void()" on:click={completeAll}>Completar todas</a>
                </div>
            {:else if view == 1}
                <div class="col-6 right">
                    <a href="javascript:void()" on:click={completeAll}>Fuera de Estancia</a>
                </div>
            {/if}
        </div>
    </div>
    <table class="cal" style="width:100%">
        <thead>
            <tr>
                <th class="hour">HORARIO</th>
                <th class="activity">ACTIVIDAD</th>
                <th class="status">ESTATUS</th>
            </tr>
        </thead>
        <tbody>
            {#each activities as activity}
                {#if view == 0 || (view == 2 && activity.prescription != '' && activity.prescription != undefined) || (view == 1 && activity.prescription == '')}
                <tr>
                    <td class="horas">{activity.time}</td>
                    <td class="actividad" class:under={activity.checkActivity} class:past={!activity.checkActivity && activity.time < time}>
                        {#if activity.prescription != ""} <b>{activity.name}</b>{:else} {activity.name} {/if}
                        {#if activity.notes != undefined}
                            <br />
                            <small>{activity.notes}</small>
                        {/if}
                    </td>
                    <td class="status">
                        <div class="custom-control custom-checkbox">
                            <input 
                                type="checkbox" 
                                class="custom-control-input" 
                                id="check{activity.id}" 
                                checked={activity.checkActivity} 
                                on:click={(event) => handleCheckClick(event, activity)} 
                                disabled={activity.checkActivity}>
                            <label class="custom-control-label" for="check{activity.id}">
                                {#if activity.checkActivity}
                                    Hecho
                                {/if}
                                <br />
                                {getCheckTime(activity.checkDate)}
                            </label>
                        </div>
                    </td>
                </tr>
                {/if}
            {/each}
        </tbody>
    </table>    
</div>

<!-- Modal -->
{#if showModal}
    <Modal 
        showModal={showModal}
        activities={selectedActivities}
        activityId={selectedActivityId}
        on:close={closeModal}
        on:allCompleted={markSubActivityComplete}
    />
{/if}

<style type="text/css" media="print">

    :global(body[data-layout=detached] #layout-wrapper) {
        overflow: visible;
    }
    :global(.main-content) {
        overflow: visible;
    }
    .card-full{
        width: 100%;
        margin-bottom: 20px;
    }
    table{
        border-collapse: unset;
    }
    table.cal {
        min-height:200px;
        width:100%;
        color: #707d8a;
        border-spacing:0;
        box-shadow: 2px #eaeaea;
        max-width: 900px;
        /* border: 1px solid grey;  
        border-radius: 20px 20px 20px 20px;
        padding: 2%;
        margin: 2%; */
    }
    .patient{
        /* display: flex; */
        box-shadow: 3px -1px 9px #aeaeae;
        max-width: 890px;
        padding: 10px;
        margin-left: 0;
        position: -webkit-sticky; /* Safari */
        position: sticky;
        top: 0;
        background-color: white;
        z-index: 100;
    }
    .right{
        text-align: right;
    }
    /* table > caption {
        border: 5px solid  grey;
        border-radius: 15px;
        text-transform: uppercase;
        text-align: center;
        background-color: #008080;
        color: #ffffff;
        font-size: 50px; 
        padding:1% 1% 1% 1% ;
        margin:2% 2% 2% 2% ;
    } */
    
    thead> tr > th { 
        /* width:30%; */
        margin: 5px;
        /* padding:2%; */
        color:#9c9d36;
        background-color: #eaeaea;
        height:40px;
        /* border: 2px outset white; */
        vertical-align:middle;
        text-align: center;
        border: 0;
        /* border-radius: 10px; */
    }

    .hour, .horas{
        background-color: #C6C851;
        color: #ffffff;
        width: 90px;
    }
    .hour{
        color: white;
        background: #9c9d36;
    }

    tr:nth-child(odd) .actividad{
        
        /* border-radius: 10px 10px 10px 10px; */
        background-image: url('/assets/images/sht.png');
        background-position: left center;
        background-repeat: no-repeat;
        background-size: 10px 100%;
    }
    tr:nth-child(even) .actividad{
        /* border-radius: 10px 10px 10px 10px; */
        background-image: url('/assets/images/shb.png');
        background-position: left center;
        background-repeat: no-repeat;
        background-size: 10px 100%;
    }
    tr:nth-child(even){
        background-color: #eaeaea;
    }
    tr:nth-child(even) .horas{
        background: #9c9d36;
    }
    .shadow{
        background-image: url('/assets/images/sht.png');
        background-position: left center;
        background-repeat: no-repeat;
        background-size: 10px 100%;
        width: 10px;
        background-color: #ffffff;
    }
    th.shadow{
        background-image: url('/assets/images/shb.png');
    }
    .status{
        position: relative;
        padding: 5px;
    }
    .status::after{
        position: absolute;
        content: ' ';
        background-image: url('/assets/images/sht.png');
        background-position: left center;
        background-repeat: no-repeat;
        background-size: 10px 100%;
        width: 10px;
        height: 100%;
        right: -10px;
        top: 0;
    }
    th.status::after{
        background-image: url('/assets/images/shb.png');
    }
    tr:nth-child(even) .status::after{
        background-image: url('/assets/images/shb.png');
    }
    th.activity{
        background-image: url('/assets/images/shb.png');
        background-position: left center;
        background-repeat: no-repeat;
        background-size: contain;
    }
    tr:nth-child(even) .shadow{
        background-image: url('/assets/images/shb.png');
    }
    

    table.cal>tbody> th,td
    {
        display:in-line;	
        /* width:30%; */
        height:40px;
        /* border: 2px outset white; */
        vertical-align:middle;
        text-align: center;
        /* border-radius: 10px; */
    }


    .activity{
        margin: 0;
        padding: 0;
        /* background-color:#FFD180 ;  */
        /* width: 600px; */
    }
    .check{
        margin: 0;
        padding: 0;
        background-color:#ffffff ; 
        width: 100px important;
    }
    .under{
        text-decoration: line-through;
    }
    .past{
        color:#800000;
    }
    
    .actividad {
        padding: 5px;
        margin: 0;
        }
    

        h5{
            text-transform: capitalize;
        }
    /* .Mates { 
        padding:0; 
        margin:0; 
        background-color: #FF8A80;
    }
    .Ingles { 
        padding:0; 
        margin:0; 
        background-color: #B39DDB ;
    }
    .Musica { 
        padding:0; 
        margin:0; 
        background-color: #FFCDD2 ;
    }
    .Tecno { 
        padding:0; 
        margin:0; 
        background-color:#008080 ;
    }
    .Edfisica { 
        padding:0; 
        margin:0; 
        background-color:#BCAAA4;
    }
    .recreo {
        background-color:#FFffff;
        margin:0;
        padding:0;
    } */
    span {
        display: block;
        text-align: center;
        color: #800000;
        visibility: hidden;
    }
    td:active > span {
        visibility: visible;
    }
  </style>
