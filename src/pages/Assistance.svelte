<script>
    import TitleBar from "../TitleBar.svelte";
    import {routes} from "../menu";
    import { workers } from '../controls/workers.js';
    import {branches} from "../controls/branches.js";
    import {positions} from "../controls/positions.js";
  
    let registros = {};
    
    let startDate = DateTime.local().startOf('week');
    let start = startDate.toISODate();
    let end = DateTime.local().endOf('week').toISODate();
    let printdate = DateTime.local().toISODate();
    let week = [];
    let posIds = ['bBzmbRytI9NCWbiGposB','je9MOOZH28KYyd09bE1s'];
    let posNames = {};

    
    
    $:start,end, loadFireStore();

    positions.subscribe((pos)=>{
        for (let pi = 0; pi < posIds.length; pi++) {
            const pid = posIds[pi];
            for (let p = 0; p < pos.length; p++) {
                const element = pos[p];
                if(element.id == pid){
                    posNames[element.id ] = element;
                }
            }
            
        }
    });
    branches.subscribe((bra)=>{
        if(bra.length == 0){
            return;
        }
        loadFireStore();
    });
  
    function loadFireStore(){
        if($branches.length == 0){
            return;
        }
        
        
        let newstart = DateTime.fromISO(start).toJSDate();
        let newend = DateTime.fromISO(end).endOf('day').toJSDate();

        for (let index = 0; index < 7; index++){
            const day = startDate.plus({days:index});
            week.push(day);     
        }
        console.log(newstart);
        console.log(newend);
    
        let query = db.collection("patientlog")
        .where('added',">",newstart)
        .where('added',"<",newend)
        // .where('positions',"==",'je9MOOZH28KYyd09bE1s')
        .where('positions',"in",posIds)
        .orderBy('added','asc')
        .orderBy('uid','asc')
        .get()
        .then((result) => {
            registros = {};
            for (let b = 0; b < $branches.length; b++) {
                const branch = $branches[b];
                registros[branch.id] = {};
                for (let index = 0; index < posIds.length; index++) {
                    const element = posIds[index];
                    registros[branch.id][element] = {};
                    for (let d = 0; d < week.length; d++) {
                        const we = week[d];
                        registros[branch.id][element][we.toISODate()]=[];
                        
                    }
                    
                }
            }

            result.forEach((doc) => {
                
                let registro = doc.data();
                registro.id = doc.id;
                registro.addedISO = DateTime.fromJSDate(registro.added.toDate()).toISODate();
                // registros.push(registro);
                console.log(registro);

                $workers.forEach(element => {
                    if(registro.uid == element.id){
                        registro.username = element.name.split(" ")[0];
                        // registros[registro.uid].paymentperiod = element.paymentperiod;
                    }
                });
                console.log(registros, registro.positions,registro.addedISO);
                registros[registro.branch][registro.positions][registro.addedISO].push(registro);


                
                // if(registros[registro.uid] == undefined){
                    
                //     $workers.forEach(element => {
                //     if(registro.uid == element.id){
                //         registro.username = element.name;
                //         // registros[registro.uid].paymentperiod = element.paymentperiod;
                //     }
                //     });
                // }
                
                // $branches.forEach(element => {
                //     if(registro.branch == element.id){
                //         registro.branchName = element.name
                //     }
                //     });
                //     if(registro.positions != undefined){
                //         $positions.forEach(element => {
                //             if(registro.positions == element.id){
                //                 registro.positionsName = element.name
                //                 registro.added = DateTime.fromJSDate(registro.added.toDate());
                //                 registro.added = luxon.DateTime.fromISO(registro.added).toISODate();
                                
                //             }
                //         });
                //     }
            });
            registros = registros;
        })
        // console.log(registros);
    }
  
    function setEditId(eId) {
      console.log("Agregando concepto", eId);
      editData = {uid:eId, type:1};
      showModal = true;
      jQuery('#editModalScrollable').modal('show');   
    }
  
    function deleteDoc(id) {
        Swal.fire({
                    title: "¿Esta seguro?",
                    text: "Desea eliminar este registro",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#34c38f",
                    cancelButtonColor: "#f46a6a",
                    confirmButtonText: "Si, borrarlo!"
                    }).then(function (result) {
                    if (result.value) {
                        db.collection("patientlog").doc(id).delete();
                    }
                }); 
    };
  
</script>
<div class="page-content">
        <TitleBar title="Reporte de Nómina" base="Dashboard" />
    <div class="row input-group" >
        <div class="col-12 no-print">
            <label>Fechas</label>
        </div>
        <div class="col-6">
            <div class="form-group mb-0 no-print">Desde<br />
                <input type="date" class="form-control" id="start" name="start" bind:value={start}  />
            </div>
        </div>
            <div class="col-6 no-print">Hasta<br />
                <input type="date" class="form-control" id="end" name="end" bind:value={end} />
            </div>
        </div>
    </div>  
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    {#each $branches as branch}
                        {#if !['N6uR7g3SkrkoAuR2jNtY','A4JNT4BK8ScnTNhsF9XZ'].includes(branch.id)}
                            <h3>{branch.name}</h3>
                            {#each posIds as p}
                                <b>{posNames[p]?.name ?? ''}</b>
                                <div class="row">
                                    {#each week as d}
                                        {#if registros[branch.id] != undefined && registros[branch.id][p] != undefined && registros[branch.id][p][d.toISODate()] != undefined}
                                            {#each registros[branch.id][p][d.toISODate()] as assistance}
                                                {#if assistance.branch == branch.id && assistance.positions == p}
                                                    <div class="col avatar-title bg-soft-primary text-primary rounded text-center p-2 m-2">
                                                        {d.weekdayShort} {d.day}<br />
                                                        {assistance.username}
                                                    </div>
                                                {/if}
                                            {:else}
                                                <div class="col avatar-title bg-soft-secondary text-primary rounded text-center p-2 m-2">
                                                    {d.weekdayShort} {d.day}<br />
                                                    -
                                                </div>
                                            {/each}
                                        {:else}
                                            <div class="col avatar-title bg-soft-secondary text-primary rounded text-center p-2 m-2">
                                                {d.weekdayShort} {d.day}<br />
                                                -
                                            </div>
                                        {/if}
                                    {/each}
                                </div>
                            {/each}
                        {/if}
                    {/each}
                    
                </div>
            </div>
        </div>
    </div> 
  
  
  <style>
    img {
        height: 100px;
    }
    .table td, .table th {
        vertical-align: middle;
        padding: 0px !important;
    }
    table{
        border: 2px #181717 solid;
        border-collapse: inherit !important;
        padding: 20px;
        width:100%;
        page-break-inside: avoid;
    }
  </style>
  