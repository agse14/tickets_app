<script>
    import TitleBar from "../TitleBar.svelte";
    import { pop } from "svelte-spa-router";
    import Activities_ResponsableTable from "../controls/Activities_ResponsableTable.svelte";
    import { tweened } from "svelte/motion";
    import { quartInOut } from "svelte/easing";
    import { onMount } from "svelte";
    import WorkersSearchListFiltered from "../controls/WorkersSearchListFiltered.svelte";
    import WorkersSearchList from "../controls/WorkersSearchList.svelte";
    // import { DateTime } from "luxon";
  
    export let params = {};
    export let values = {};
    export let branchId = params.bid;
    export let onBack = ()=> {
      pop();
    }

    // $: autoScrollDown(), autoScrollUp();

    let container;
    let patients = [];
    let groups = [];
    let assigments = {};
    let loading;
    let branchName;
    let patientId;
    let lenght;
    let query;
    let isPaused;
    let cleaningPositions = []; // Array para almacenar los puestos de limpieza
    let today = DateTime.local()
            .setLocale("es-mx");

    onMount(() => {
        
        loadData();
    });
    
    async function loadData() {
        if (!branchId) {
        console.log("Error! No hay una estancia seleccionada");
        }else{
        // Consultar puestos de limpieza para este branch
        try {
            const cleaningRoles = await db.collection("workroles")
                .where("branches", "==", branchId)
                .get();
            
            const positionIds = [];
            cleaningRoles.forEach((roleDoc) => {
                const roleData = roleDoc.data();
                if (roleData.positions) {
                    positionIds.push(roleData.positions);
                }
            });

            // Consultar los detalles de cada posición para identificar las de limpieza
            cleaningPositions = [];
            for (const positionId of positionIds) {
                try {
                    const positionDoc = await db.collection("positions").doc(positionId).get();
                    if (positionDoc.exists) {
                        const positionData = positionDoc.data();
                        const positionName = positionData.name.toLowerCase();
                        
                        // Identificar puestos de limpieza por palabras clave
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
                    console.error(`Error al consultar posición ${positionId}:`, error);
                }
            }
            
            console.log("Puestos de limpieza encontrados:", cleaningPositions);
        } catch (error) {
            console.error("Error al consultar puestos de limpieza:", error);
            // Si hay error, usar un puesto por defecto
            cleaningPositions = [{ id: 'default', name: 'Limpieza', data: {} }];
        }

        db.collection("branches")
        .doc(branchId)
        .get()
        .then((snap)=>{
            if(snap.exists){
                groups = [];
                branchName = snap.data().name;
                if( snap.data().groups != undefined && snap.data().groups > 0){
                    for (let index = 1; index <= snap.data().groups; index++) {
                        groups.push({name:"Grupo "+(index),uid:index});
                    }
                }
                // console.log(branchName);

            }
        });
        const grps = await db.collection("patient_user")
        .where("branch","==",branchId)
        .where("dayId","==",today.toISODate())
        .get();
        grps.forEach((doc)=>{
            const data = doc.data();
            if(data == undefined || data == null || data.workers == undefined || data.workers == null){
                return;
            }
            let shift = "day";
            if(data.shift == false){
                shift = "night";
            }
            
            // Verificar si es un grupo de limpieza con posición específica
            const groupStr = data.group ? String(data.group) : "";
            if(groupStr && groupStr.startsWith("limpieza-")) {
                // Es un puesto específico de limpieza
                assigments[data.group + "-" + shift] = data.workers;
            } else {
                // Es un grupo normal
                assigments[data.group + "-" + shift] = data.workers;
            }
        });
        
        query = db.collection("patients")
            .where('branch',"==",branchId)
            // .where('dayId',"==",today.toISODate())
            .orderBy('name','asc')
            .onSnapshot((result) => {
                // console.log(result);
                patients = [];
                result.forEach((doc) => {
                    // console.log(doc.data());
                    const temppatient = doc.data();
                    temppatient.id = doc.id;
                    if(temppatient.status == undefined){
                        temppatient.status = 0;
                    }
                    if(temppatient.status != 0){
                        return;
                    }
                    // console.log(temppatient.id);
                    patients.push(temppatient);
                    
                    lenght = patients.length;
                    // console.log(lenght);
                }); 
                patients = patients;
                // console.log("on snap test",patients);
            });
        }
    }
    

    function assign(pId, wId) {
    // Actualizar o desasignar el trabajador del paciente
        const newWorkerId = wId || null; // Si `wId` es null, desasignar
        db.collection("patients").doc(pId).update({ workers: newWorkerId })
            .then(() => {
                console.log(`Asignación actualizada para el paciente ${pId}: Trabajador ${newWorkerId || "desasignado"}`);
            })
            .catch((err) => {
                console.error(`Error al actualizar la asignación: ${err}`);
            });
    }
    
    async function assignCleaningPosition(positionId, wId, dayShift) {
        const shift = dayShift ? "day" : "night";
        const cleaningDocId = `${branchId}-${today.toISODate()}-limpieza-${positionId}-${shift}`;
        try {
            if (wId) {
                await db.collection("patient_user").doc(cleaningDocId).set({
                    added: new Date(),
                    workers: wId,
                    branch: branchId,
                    dayId: today.toISODate(),
                    group: "limpieza-" + positionId,
                    shift: dayShift,
                    positionId: positionId,
                });
                assigments[`limpieza-${positionId}-${shift}`] = wId;
                Swal.fire({
                    icon: "success",
                    title: "Asignación completada",
                    text: `El personal de limpieza (${shift}) ha sido asignado correctamente.`,
                });
            } else {
                await db.collection("patient_user").doc(cleaningDocId).delete();
                assigments[`limpieza-${positionId}-${shift}`] = null;
                Swal.fire({
                    icon: "success",
                    title: "Desasignación completada",
                    text: `El personal de limpieza (${shift}) ha sido desasignado correctamente.`,
                });
            }
        } catch (err) {
            console.error(`Error al asignar/desasignar limpieza: ${err}`);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `No se pudo asignar/desasignar el personal de limpieza (${shift}).`,
            });
        }
    }
    
    async function assignCleaningWorker(wId, dayShift) {
        const shift = dayShift ? "day" : "night";
        const cleaningDocId = `${branchId}-${today.toISODate()}-limpieza-${shift}`;
        try {
            if (wId) {
                await db.collection("patient_user").doc(cleaningDocId).set({
                    added: new Date(),
                    workers: wId,
                    branch: branchId,
                    dayId: today.toISODate(),
                    group: "limpieza",
                    shift: dayShift,
                });
                assigments["limpieza-" + shift] = wId;
                Swal.fire({
                    icon: "success",
                    title: "Asignación completada",
                    text: `El personal de limpieza (${shift}) ha sido asignado correctamente.`,
                });
            } else {
                await db.collection("patient_user").doc(cleaningDocId).delete();
                assigments["limpieza-" + shift] = null;
                Swal.fire({
                    icon: "success",
                    title: "Desasignación completada",
                    text: `El personal de limpieza (${shift}) ha sido desasignado correctamente. Puede seleccionar el reemplazo ahora.`,
                });
            }
        } catch (err) {
            console.error(`Error al asignar/desasignar limpieza: ${err}`);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `No se pudo asignar/desasignar el personal de limpieza (${shift}). Inténtalo nuevamente.`,
            });
        }
    }


    async function assignGroup(gId, wId, dayShift) {
        const shift = dayShift ? "day" : "night";
        const groupDocId = `${branchId}-${today.toISODate()}-${gId}-${shift}`;
        try {
            if (wId) {
                // Asignar un trabajador al grupo
                await db.collection("patient_user").doc(groupDocId).set({
                    added: new Date(),
                    workers: wId,
                    branch: branchId,
                    dayId: today.toISODate(),
                    group: gId,
                    shift: dayShift,
                });
                assigments[gId + "-" + shift] = wId;
                Swal.fire({
                    icon: "success",
                    title: "Asignación completada",
                    text: `El grupo ${gId} (${shift}) ha sido asignado correctamente.`,
                });
            } else {
                // Desasignar al trabajador del grupo
                await db.collection("patient_user").doc(groupDocId).update({ workers: null });
                assigments[gId + "-" + shift] = null;
                Swal.fire({
                    icon: "success",
                    title: "Desasignación completada",
                    text: `El grupo ${gId} (${shift}) ha sido desasignado correctamente. Puede seleccionar el reemplazo ahora.`,
                });
            }
        } catch (err) {
            console.error(`Error al asignar/desasignar grupo: ${err}`);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: `No se pudo asignar/desasignar el grupo ${gId} (${shift}). Inténtalo nuevamente.`,
            });
        }
    }
    
    function cancel() {
      onBack();
    }
  
</script>
<div class="page-content modal-body">
    <TitleBar title="Tarjeta de Actividades Individual" base="Inventario" />
    <div class="outter">
        <form id="form">
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body" bind:this={container}>
                            <!-- <button on:click={()=>{top.set(-1000);}}>Animate</button> -->
                            <div class="inner">
                                <div class="row">
                                    <div class="col-12">
                                        <h3>{today.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</h3>
                                        <button class="btn btn-primary" type="button" on:click={()=>{pop()}}>Regresar</button>
                                    </div>
                                    
                                    <div class="col-12 row">
                                        {#each groups as gp}
                                            
                                            <div class="col-6" style="padding: 20px;">
                                                Responsable del {gp.name} <br/>
                                                Día: 
                                                <WorkersSearchListFiltered
                                                    value={assigments[gp.uid + "-day"]}
                                                    onSelect={(selected) => assignGroup(gp.uid, selected.id, true)}
                                                    inlist={false}
                                                    baseId={"grpd" + gp.uid}
                                                />
                                                <button class="btn btn-danger btn-sm" type="button" on:click={() => assignGroup(gp.uid, null, true)}>
                                                    Quitar
                                                </button>
                                                <br />
                                                Noche: 
                                                <WorkersSearchListFiltered
                                                    value={assigments[gp.uid + "-night"]}
                                                    onSelect={(selected) => assignGroup(gp.uid, selected.id, false)}
                                                    inlist={false}
                                                    baseId={"grpn" + gp.uid}
                                                />
                                                <button class="btn btn-danger btn-sm" type="button" on:click={() => assignGroup(gp.uid, null, false)}>
                                                    Quitar
                                                </button>
                                            </div>                                                                       
                                            
                                        {/each}

                                        <!-- <div class="col-6" style="padding: 20px;">
                                            Responsable del {gp.name} <br/>
                                            Día: 
                                            <WorkersSearchListFiltered
                                                value={assigments[gp.uid + "-day"]}
                                                onSelect={(selected) => assignGroup(gp.uid, selected.id, true)}
                                                inlist={false}
                                                baseId={"grpd" + gp.uid}
                                            />
                                            <button class="btn btn-danger btn-sm" type="button" on:click={() => assignGroup(gp.uid, null, true)}>
                                                Quitar
                                            </button>
                                            <br />
                                            Noche: 
                                            <WorkersSearchListFiltered
                                                value={assigments[gp.uid + "-night"]}
                                                onSelect={(selected) => assignGroup(gp.uid, selected.id, false)}
                                                inlist={false}
                                                baseId={"grpn" + gp.uid}
                                            />
                                            <button class="btn btn-danger btn-sm" type="button" on:click={() => assignGroup(gp.uid, null, false)}>
                                                Quitar
                                            </button>
                                        </div>   -->
                                        
                                    </div>
                                    <div class="col-12">
                                        <hr />
                                        <h3>Asignación de personal de limpieza</h3>
                                        {#each cleaningPositions as position}
                                            <div class="col-6" style="padding: 20px;">
                                                <h4>Responsable de {position.name}</h4>
                                                Día: 
                                                <WorkersSearchListFiltered
                                                    value={assigments[`limpieza-${position.id}-day`]}
                                                    onSelect={(selected) => assignCleaningPosition(position.id, selected.id, true)}
                                                    inlist={false}
                                                    baseId={`cleaning-${position.id}-day`}
                                                />
                                                <button class="btn btn-danger btn-sm" type="button" on:click={() => assignCleaningPosition(position.id, null, true)}>
                                                    Quitar
                                                </button>
                                                <br />
                                                Noche: 
                                                <WorkersSearchListFiltered
                                                    value={assigments[`limpieza-${position.id}-night`]}
                                                    onSelect={(selected) => assignCleaningPosition(position.id, selected.id, false)}
                                                    inlist={false}
                                                    baseId={`cleaning-${position.id}-night`}
                                                />
                                                <button class="btn btn-danger btn-sm" type="button" on:click={() => assignCleaningPosition(position.id, null, false)}>
                                                    Quitar
                                                </button>
                                            </div>
                                        {/each}
                                        {#if cleaningPositions.length === 0}
                                            <!-- Fallback si no se encontraron puestos específicos -->
                                            <div class="col-6" style="padding: 20px;">
                                                Responsable de Limpieza <br/>
                                                Día: 
                                                <WorkersSearchListFiltered
                                                    value={assigments["limpieza-day"]}
                                                    onSelect={(selected) => assignCleaningWorker(selected.id, true)}
                                                    inlist={false}
                                                    baseId={"cleaning-day"}
                                                />
                                                <button class="btn btn-danger btn-sm" type="button" on:click={() => assignCleaningWorker(null, true)}>
                                                    Quitar
                                                </button>
                                                <br />
                                                Noche: 
                                                <WorkersSearchListFiltered
                                                    value={assigments["limpieza-night"]}
                                                    onSelect={(selected) => assignCleaningWorker(selected.id, false)}
                                                    inlist={false}
                                                    baseId={"cleaning-night"}
                                                />
                                                <button class="btn btn-danger btn-sm" type="button" on:click={() => assignCleaningWorker(null, false)}>
                                                    Quitar
                                                </button>
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="col-12">
                                        <hr />
                                        <h3>Asignación de grupos</h3>
                                    </div>
                                </div>
                                <div class="row">
                                    {#each patients as patient}
                                        <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3">
                                            <h5>{patient.name}</h5>
                                            {#each groups as gp}
                                                <input type="checkbox" on:click={()=>{assign(patient.id, gp.uid);}} checked={patient.workers === gp.uid} /> {gp.name}<br />
                                            {/each}
                                            <hr />
                                        </div>
                                        <!-- <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3">
                                            <h5>{patient.name}</h5>
                                            {#each groups as gp}
                                                <input
                                                    type="checkbox"
                                                    on:change={(event) => {
                                                        assign(patient.id, event.target.checked ? gp.uid : null);
                                                    }}
                                                    checked={patient.workers === gp.uid}
                                                />
                                                {gp.name}
                                                <br />
                                            {/each}
                                            <hr />
                                        </div> -->
                                    {/each}
                                </div>       
                            </div>                                  
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>
<style>
.inner {
    position:relative;
}
.outter {
    width: 100%;
}
</style>