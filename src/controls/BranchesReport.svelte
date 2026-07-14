<script>
    import { onDestroy} from 'svelte';
    import { fbuser, permissions, profile } from "../stores.js";

    export let branches = "";
    let unsubscribe;
    let rooms = [];
    let ocupation = 0;
    let called = 0;
    let available = 0;
    let type_ind = 0;
    let type_comp = 0;
    let roomsByBranchesAndStatus = {};

    onDestroy(() => {
        if(unsubscribe != null && unsubscribe != undefined){
            unsubscribe();
        }
    });

    
    let query = db.collection("room_inventory").orderBy('added','desc');
    if(branches != ""){
        query = query.where("branches","==",branches);
    }
    unsubscribe = query.onSnapshot(async (querySnapshot) => {
        const tmp = [];
        type_ind =0;
        type_comp=0;
        ocupation = 0;
        available=0;
        called = 0;
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const tempsupervision = doc.data();
            tempsupervision.id = doc.id;
            if(tempsupervision.type == 0){
                type_ind++;
            }else{
                type_comp++;
            }
            if(tempsupervision.status == 0){
                ocupation++;
            }
            if(tempsupervision.status == 1){
                available++;
            }
            if(tempsupervision.status == 2){
                called++;
            }
            tmp.push(tempsupervision);
            
            
        });
        rooms = tmp;
        // Objeto para almacenar los datos de las habitaciones agrupadas por sucursal y estado
        roomsByBranchesAndStatus = {};

        // Iterar sobre cada habitación en la lista rooms
        rooms.forEach(room => {
            const branch = room.branches; // Obtener el valor de la propiedad branches
            const status = room.status; // Obtener el valor de la propiedad status
            const cost = room.cost; // Obtener el valor de la propiedad cost

            // Comprobar si ya existe una entrada para esta sucursal
            if (!roomsByBranchesAndStatus[branch]) {
                // Si no existe, crear un nuevo objeto para la sucursal
                roomsByBranchesAndStatus[branch] = {};
                roomsByBranchesAndStatus[branch].branchName = ""; // Inicializar el nombre de la sucursal
                roomsByBranchesAndStatus[branch].totalRooms = 0; // Inicializar el total de habitaciones
                roomsByBranchesAndStatus[branch].totalCost = 0; 
            }

            // Comprobar si ya existe una entrada para este estado
            if (!roomsByBranchesAndStatus[branch][status]) {
                // Si no existe, crear un nuevo array para el estado
                roomsByBranchesAndStatus[branch][status] = [];
                roomsByBranchesAndStatus[branch][`${status}Cost`] = 0;
            }

            // Agregar la habitación al array correspondiente a su sucursal y estado
            roomsByBranchesAndStatus[branch][status].push(room);

            // Incrementar el contador de habitaciones para esta sucursal
            roomsByBranchesAndStatus[branch].totalRooms++;
            roomsByBranchesAndStatus[branch].totalCost += cost;
            // Incrementar el costo total para este estado
            roomsByBranchesAndStatus[branch][`${status}Cost`] += cost;

            // Consultar Firestore para obtener el nombre de la sucursal correspondiente
            db.collection("branches").doc(branch).get()
                .then((doc) => {
                    if (doc.exists) {
                        const branchData = doc.data();
                        // Filtrar branches que NO tengan test: true
                        if (branchData.test === true) {
                            // Si tiene test: true, eliminar la sucursal del objeto
                            delete roomsByBranchesAndStatus[branch];
                            return;
                        }
                        const branchName = branchData.name;
                        roomsByBranchesAndStatus[branch].branchName = branchName;
                    } else {
                        console.log(`No se encontró la sucursal para la rama ${branch}`);
                    }
                })
                .catch((error) => {
                    console.log(`Error al obtener el nombre de la sucursal para la rama ${branch}:`, error);
                });
        });
        console.log(roomsByBranchesAndStatus);
        // Luego puedes usar roomsByBranchesAndStatus en tu lógica restante
    });
</script>
{#if $permissions.accounting || $permissions.admin || $permissions.admin_inventory}
<h2>Reportes</h2>
<div class="row">
    <div class="col-8">
        <div class="card">
            <div class="card-body">
                <div class="media">
                    <div class="avatar-sm font-size-20 mr-3">
                        <span class="avatar-title bg-soft-primary text-primary rounded">
                            <i class="mdi mdi-account-multiple-outline"></i>
                        </span>
                    </div>
                    <div class="media-body">
                        <div class="font-size-16 mt-2">Habitaciones</div>
                    </div>
                </div>
                <h4 class="mt-4">{rooms.length} Total</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Estancia</th>
                                <th>Espacios Totales</th>
                                <th>Espacios Ocupados</th>
                                <th>Espacios Separados</th>
                                <th>Espacios Disponibles</th>
                                <th>% de Ocupación</th>
                                <th>% de Disponibilidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each Object.entries(roomsByBranchesAndStatus) as [branchName, branchData]}
                                {#if branchData.totalRooms > 0}
                                    <tr>
                                        <td><span class="text-primary mr-2">{branchData.branchName}</span></td>
                                        <td class="center-text">{branchData.totalRooms}</td>
                                        {#if branchData[0]}
                                            <td class="center-text">{branchData[0].length}</td>
                                        {:else}
                                            <td class="center-text">0</td>
                                        {/if}
                                        {#if branchData[2]}
                                            <td class="center-text">{branchData[2].length}</td>
                                        {:else}
                                            <td class="center-text">0</td>
                                        {/if}
                                        {#if branchData[1]}
                                            <td class="center-text"><span class="text-success mr-2">{branchData[1].length}/(${branchData["1Cost"].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span></td>
                                        {:else}
                                            <td class="center-text">0</td>
                                        {/if}
                                        <td class="center-text">
                                            {#if branchData[0]}
                                                {(branchData[0].length / branchData.totalRooms * 100).toFixed(2)}%
                                            {:else}
                                                0%
                                            {/if}
                                        </td>
                                        <td class="center-text">
                                            {#if branchData[1]}
                                                {(branchData[1].length / branchData.totalRooms * 100).toFixed(2)}%
                                            {:else}
                                                0%
                                            {/if}
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                </div>            
            </div>
        </div>
    </div>     
    <div class="col-4">
        <div class="card">
            <div class="card-body">
                <div class="media">
                    <div class="avatar-sm font-size-20 mr-3">
                        <span class="avatar-title bg-soft-primary text-primary rounded">
                                <i class="mdi mdi-account-multiple-outline"></i>
                            </span>
                    </div>
                    <div class="media-body">
                        <div class="font-size-16 mt-2">Porcentaje de ocupación</div>
                    </div>
                </div>
                <h4 class="mt-4">{(ocupation*100/ rooms.length).toFixed(1)}%</h4>
                <div class="row">
                    <div class="col-7">
                        <p class="mb-0"><span class="text-success mr-2"> {ocupation} Ocupadas  </span></p>
                        <p class="mb-0"><span class="text-success mr-2"> {called} Separadas  </span></p>
                        <p class="mb-0"><span class="text-success mr-2"> {available} Disponibles  </span></p>
                    </div>
                    <div class="col-5 align-self-center">
                        <div class="progress progress-sm">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: {(ocupation*100/ rooms.length).toFixed(0)}%" aria-valuenow="62" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-4"></div>
</div>
{:else}
    <h2>Acceso Denegado</h2>
    <p>No tienes permisos para ver este encabezado.</p>
{/if}

<style>
    .center-text {
        text-align: center;
    }
</style>