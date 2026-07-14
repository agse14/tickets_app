<script>
    import TitleBar from "../TitleBar.svelte";
    import { link } from "svelte-spa-router";
    import { pop } from "svelte-spa-router";
    import Activities_table from "../controls/Activities_table.svelte";
    import { tweened } from "svelte/motion";
    import { quartInOut } from "svelte/easing";
    import { onMount, onDestroy } from "svelte";
    import WorkersSearchList from "../controls/WorkersSearchList.svelte";
    import { workers } from "../controls/workers";
    import { partners } from "../controls/partners";
    import { writable } from "svelte/store";
  
    export let params = {};
    export let values = {};
    export let branchId = params.bid;
    export let menu = true;
    export let onBack = ()=> {
      pop();
    }
    

    // $: autoScrollDown(), autoScrollUp();
    let view = 1;
    let container;
    let patients = [];
    let responsables = {};
    let groups = {};
    let loading;
    let branchName;
    let patientId;
    let pause = 0;
    let lenght;
    let query;
    let queryActivites;
    let isPaused;
    let scroller;
    let y;
    let interaction;
    let today = DateTime.local()
            .setLocale("es-mx");
    let attendant;    
    let attendantPhone;    
    let cleaningPositions = []; // Array para almacenar los puestos de limpieza    

    onMount(() => {
        
        if(menu == false){
            jQuery(".vertical-menu").hide();
            jQuery(".footer").hide();

        }
        interaction = setTimeout(() => {
            if(scroller != undefined){
                clearInterval(scroller);
            }
            scroller = setInterval(() => {
                if(pause > 0 || container == undefined){
                    //pause--;
                    return;
                }
                console.log("screen", $top , container.offsetHeight);
                if(patients.length < 4){
                    return;
                }
                let pScroll = 600;
                if(patients.length >= 4){
                    pScroll = 300;
                }
                if($top > container.offsetHeight -pScroll){
                    top.set(0);
                    return;
                }
                top.set($top+300);
                //console.log("screen", $top , container.offsetHeight);
            }, 5000);

        }, 5000);
    });
    onDestroy(()=>{
        query();
        queryActivites();
        clearInterval(scroller);
    });

    loadData();

    async function loadData() {
        if (!branchId) {
            console.log("Error! No hay una estancia seleccionada");
        } else {
            // Consultar puestos de limpieza para este branch usando la misma lógica que ActivitiesEdit
            try {
                // Primero, buscar todas las posiciones de limpieza/aseo
                const allPositions = await db.collection("positions").get();
                
                const cleaningPositionIds = [];
                allPositions.forEach((positionDoc) => {
                    const positionData = positionDoc.data();
                    const positionName = positionData.name.toLowerCase();
                    
                    // Identificar puestos de limpieza por palabras clave
                    if (positionName.includes('limpieza') || 
                        positionName.includes('aseo') || 
                        positionName.includes('intendencia') || 
                        positionName.includes('mantenimiento')) {
                        cleaningPositionIds.push(positionDoc.id);
                    }
                });

                // Ahora consultar workroles que tengan estas posiciones Y pertenezcan al branch
                const cleaningRoles = await db.collection("workroles")
                    .where("branches", "==", branchId)
                    .get();
                
                // Construir el array de puestos de limpieza con números
                cleaningPositions = [];
                let cleaningCounter = 1;
                
                cleaningRoles.forEach((roleDoc) => {
                    const roleData = roleDoc.data();
                    
                    // Verificar si este workrole tiene una posición de limpieza
                    if (roleData.positions && cleaningPositionIds.includes(roleData.positions)) {
                        // Encontrar los datos de la posición
                        const positionData = allPositions.docs.find(doc => doc.id === roleData.positions)?.data();
                        
                        cleaningPositions.push({
                            id: roleDoc.id, // Usar el ID del workrole
                            name: positionData?.name || 'Sin nombre',
                            cleaningNumber: cleaningCounter,
                            data: roleData,
                            positionData: positionData
                        });
                        
                        cleaningCounter++;
                    }
                });
                
                console.log("Puestos de limpieza encontrados:", cleaningPositions);
                
                // Si no hay workroles específicos, agregar uno por defecto
                if (cleaningPositions.length === 0) {
                    cleaningPositions = [{ 
                        id: 'default', 
                        name: 'Limpieza General', 
                        cleaningNumber: 1,
                        data: {} 
                    }];
                }
                
            } catch (error) {
                console.error("Error al consultar puestos de limpieza:", error);
                // Si hay error, usar un puesto por defecto
                cleaningPositions = [{ 
                    id: 'default', 
                    name: 'Limpieza General', 
                    cleaningNumber: 1,
                    data: {} 
                }];
            }

            // Obtenemos el nombre de la sucursal
            db.collection("branches")
                .doc(branchId)
                .get()
                .then((snap) => {
                    if (snap.exists) {
                        branchName = snap.data().name;
                        $partners.forEach(partner => {
                            const partnerFolio = partner.folio;
                            $workers.forEach(element => {
                                if (element.positions == `tXyo5BBNTpPWUytF8rd9` && element.branches == branchId && element.status == `Activo` && element.folio === partnerFolio) {
                                    attendant = element.name;
                                    attendantPhone = partner.phone;
                                    // console.log(attendant, attendantPhone);
                                }
                            });
                        });
                    }
                });

            // console.log(`paso 1`);

            // Obtenemos los grupos
            const grps = await db.collection("patient_user")
                .where("branch", "==", branchId)
                .where("dayId", "==", today.toISODate())
                .get();

            grps.forEach((docg, index) => {
                const data = docg.data();
                if (data && data.workers) {
                    groups[data.group] = data.workers;
                    console.log("data.group", data.group, data.workers);
                }
            });
            // console.log("groups", groups);

            // Procesamos los pacientes y responsables
            query = db.collection("patients")
                .where('branch', "==", branchId)
                .orderBy('name', 'asc')
                .onSnapshot((result) => {
                    patients = [];
                    responsables = {};

                    result.forEach((doc) => {
                        const temppatient = doc.data();
                        temppatient.id = doc.id;
                        if (temppatient.status == undefined) {
                            temppatient.status = 0;
                        }
                        if (temppatient.status != 0) {
                            return;
                        }

                        // Solo asignar responsables si existen en patient_user para el día actual
                        let groupKey = temppatient.workers;
                        let workerId = groups[groupKey];

                        if (workerId) {
                            // Buscar el trabajador solo si está asignado hoy
                            const worker = $workers.find(w => w.id === workerId);
                            if (worker) {
                                if (!responsables[workerId]) {
                                    responsables[workerId] = {
                                        total: 0,
                                        completed: 0,
                                        workerName: worker.name,
                                        groupIndex: groupKey
                                    };
                                }
                            }
                        }

                        patients.push(temppatient);
                    });

                    // Eliminar responsables vacíos o no asignados
                    Object.keys(responsables).forEach(rid => {
                        if (!responsables[rid].workerName) {
                            delete responsables[rid];
                        }
                    });

                    patients = patients;
                });

            queryActivites = db.collection("cardActivities")
                .where('branches', "==", branchId)
                .where('dayId', "==", today.toISODate())
                .orderBy('time', 'asc')
                .onSnapshot((aresult) => {
                    aresult.forEach((doc) => {
                        const tempactivity = doc.data();
                        tempactivity.id = doc.id;

                        patients.forEach((element) => {
                            if (element.id === tempactivity.patient && element.workers) {
                                if (responsables[element.workers]) {
                                    responsables[element.workers].total++;
                                    if (tempactivity.checkActivity === true) {
                                        responsables[element.workers].completed++;
                                    }
                                }
                            }
                        });
                    });
                });
        }
    }
    // const top = tweened(0, {
    //     duration: 1000,
    //     easing: quartInOut
    // });
    const top = writable(0);

    function pauseScroll() {

        pause = pause > 0 ? 0: 3;

    }

    let activeTab = writable(0);


    // const scroller = setInterval(() => {
    //     if(patients.length < 4){
    //         return;
    //     }
    //     top.set($top-400);
    //     if ($top <= (-container.offsetHeight)) {
    //         $top = 0;//container.offsetHeight;
    //     }
        
    // }, 8000);
    
    function cancel() {
      onBack();
    }
    console.log(view);
  
</script>
<svelte:window bind:scrollY={$top}/>
<div class="page-content modal-body resize">
    <!-- <TitleBar title="Tarjeta de Actividades Individual" base="Inventario" /> --> 
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-6">
                        Ver: <button on:click={()=>{view = 0;}} class="btn btn-sm {view == 0 ?'btn-primary':'btn-outline-primary'}">Todo</button> <button on:click={()=>{view = 1;}} class="btn btn-sm {view == 1 ?'btn-primary':'btn-outline-primary'}">Actividades</button> <button on:click={()=>{view = 2;}} class="btn btn-sm {view == 2 ?'btn-primary':'btn-outline-primary'}">Medicamentos</button>
                        </div>
                        <div class="col-6">
                            
                            <div class="float-right">
                                <button on:click={pauseScroll} class="btn btn-sm btn-outline-primary">
                                    {#if pause == 0}
                                        Pausar <i class="fab fab-pause"></i>
                                    {:else}
                                        Reanudar <i class="fab fab-play"></i>
                                    {/if}
                                </button>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <p>Responsables: <a href={"/cardresponsable/"+branchId} use:link class="btn btn-sm btn-primary">Asignar Responsables</a></p>
                    <div class="row">
                        {#each Object.keys(responsables) as r}
                            <div class="col-4">
                                <h3>Grupo {responsables[r].groupIndex ?? ''}</h3>
                                <h4>Responsable: {responsables[r].workerName ?? 'No asignado'}</h4>
                                <h2>{responsables[r].total == 0 ? '0' : (responsables[r].completed * 100 / responsables[r].total).toFixed(0)}%</h2>
                                Actividades. <small>{responsables[r].completed}/{responsables[r].total}</small>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- <div class="row"> -->
        <!-- <div class="branch-header"> -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="row">  
                                <div class="branch-header">
                                    {#if branchName}
                                    <div class="row">
                                        <div class="col-12">
                                            <div class="row">
                                                <div class="col-4">
                                                    <h4>Encargado/Encargada: {attendant}</h4>
                                                </div>
                                                <div class="col-4">
                                                    <h1>Estancia: {branchName}</h1>
                                                </div>
                                                <div class="col-4">
                                                    <h4>Telefono: {attendantPhone}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <!-- </div> -->
    <!-- </div> -->
    <div class="tabs-container">
        <!-- Navegación de pestañas -->
        <div class="tabs-nav">
            <button 
                class="btn btn-sm {activeTab === 0 ? 'btn-primary' : 'btn-outline-primary'}" 
                on:click={() => $activeTab = 0}>
                Pacientes
            </button>
            <button 
                class="btn btn-sm {activeTab === 1 ? 'btn-primary' : 'btn-outline-primary'}" 
                on:click={() => $activeTab = 1}>
                Limpieza
            </button>
            <button 
                class="btn btn-sm {activeTab === 2 ? 'btn-primary' : 'btn-outline-primary'}" 
                on:click={() => $activeTab = 2}>
                Lavandería
            </button>
        </div>
    
        <!-- Contenido de pestañas -->
        <div class="tabs-content">
            {#if $activeTab === 0}
                <!-- Tablas de pacientes -->
                <div class="row">
                    {#each patients as patient}
                        <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3">
                            <Activities_table uId={patient.id} view={view} />
                        </div>
                    {/each}
                </div>
            {/if}
    
            {#if $activeTab === 1}
                <!-- Tarjetas de limpieza por cleaningNumber -->
                <div class="row">
                    {#each cleaningPositions as position}
                        <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3">
                            <Activities_table 
                                uId={"limpieza-" + position.cleaningNumber} 
                                view={0} 
                                positionName={"#" + position.cleaningNumber + " - " + position.name}
                                cleaningNumber={position.cleaningNumber}
                            />
                        </div>
                    {/each}
                </div>
            {/if}
    
            {#if $activeTab === 2}
                <!-- Tabla de lavandería -->
                <div class="row">
                    <div class="col-sm-12 col-md-6 col-lg-4 col-xl-3">
                        <Activities_table uId={"lavanderia"} view={0} />
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
<style>
/* *{
    margin:0;
    padding:0;
} 
.col-sm-12.col-md-6.col-lg-4.col-xl-3{
    position:relative;
    top:0px;
}
.row{
    overflow:hidden;
} */
.resize{
    font-size: 70%;
}
.full{
    width: 100%;
}
.sticky{
    position: sticky;
    top: 0;
    z-index: 100;
}
.outter {
    /* position:absolute;
    overflow:hidden; */
    width: 100%;
    /* min-height: 500px; */
}
.branch-header {
    width: 100%;
    max-height: 70px;
    margin: auto 0;
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    padding: 10px;
    z-index: 1000;
    border-bottom: 1px solid #ddd;
    text-align: center;
}
    .tabs-container {
        margin: 20px 0;
    }

    .tabs-nav {
        display: flex;
        list-style: none;
        padding: 0;
        border-bottom: 2px solid #ccc;
    }

    /* .tab-btn {
        padding: 10px 20px;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
        cursor: pointer;
        border-radius: 5px;
        transition: all 0.3s ease;
    }

    .tab-btn.active {
        background-color: #007BFF;
        color: white;
        border-color: #007BFF;
    }

    .tab-btn:hover {
        background-color: #e0e0e0;
    } */

    .tabs-content {
        padding: 20px;
        border: 1px solid #ccc;
        background: #fff;
        border-radius: 5px;
    }
</style>