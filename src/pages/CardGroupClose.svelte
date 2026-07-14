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
    import { writable } from "svelte/store";
    import { fbuser, profile } from "../stores";
  
    export let params = {};
    export let values = {};
    export let branchId = params.bid;
    export let menu = true;
    export let onBack = ()=> {
      pop();
    }
    
    
    // $: autoScrollDown(), autoScrollUp();
    let view = 0;
    let container;
    let patients = [];
    let responsables = {};
    let groups = {};
    let loading;
    let branchName;
    let patientId;
    let lenght;
    let query;
    let queryActivites;
    let isPaused;
    let scroller;
    let y;
    let interaction;
    let today = DateTime.local()
            .setLocale("es-mx");

    onMount(() => {
        
        
    });
    onDestroy(()=>{
        query();
        queryActivites();
        clearInterval(scroller);
    });
    profile.subscribe((val)=>{
        if(val != undefined && val.branches != undefined){
            branchId = val.branches;
            loadData();
        }
    });

    
    async function loadData() {
        if (!branchId) {
        console.log("Error! No hay una estancia seleccionada");
        }else{
        db.collection("branches")
        .doc(branchId)
        .get()
        .then((snap)=>{
            if(snap.exists){
                branchName = snap.data().name;
                // console.log(branchName);
            }
        });

        const grps = await db.collection("patient_user")
                .where("branch","==",branchId)
                .get();
                
                grps.forEach((docg)=>{
                    const datag = docg.data();
                    datag.id = docg.id;
                    
                    groups[datag.uid]= datag;
                });
                groups = groups;
                console.log("groups", groups);
        
        query = db.collection("patients")
            .where('branch',"==",branchId)
            // .where('dayId',"==",today.toISODate())
            .orderBy('name','asc')
            .onSnapshot((result) => {
                // console.log(result);
                patients = [];
                responsables = {};
                // console.log("loading patients", result.docs);
                result.forEach((doc) => {
                    // console.log(doc.data());
                    const temppatient = doc.data();
                    temppatient.id = doc.id;
                    // console.log(temppatient.id);
                    if(temppatient.workers != undefined && temppatient.workers != undefined && responsables[temppatient.workers] == undefined){
                        responsables[temppatient.workers] = {total:0, completed:0};
                    }
                    if(temppatient.status == 0 || temppatient.status == undefined){
                        patients.push(temppatient);
                    }
                    
                    
                    
                    // console.log(lenght);
                }); 
                console.log("responsables", responsables);
                patients = patients;
                // console.log("on snap test",patients);
                queryActivites = db.collection("cardActivities")
                    .where('branch',"==",branchId)
                    .where('dayId',"==",today.toISODate())
                    .orderBy('time','asc')
                    .onSnapshot((aresult) => {
                        // activities = [];
                        // console.log("loading activities", aresult.docs);
                        // for (let r = 0; r < Object.keys(responsables).length; r++) {
                        //     responsables[r]= {total:0, completed:0};
                            
                        // }
                        aresult.forEach((doc) => {
                            
                            const tempactivity = doc.data();
                            tempactivity.id = doc.id;
                            // console.log("found activity", tempactivity);
                            for (let p = 0; p < patients.length; p++) {
                                const element = patients[p];
                                if(element.id == tempactivity.patient){
                                    // console.log("found patient", element, tempactivity);
                                    if(element.workers != undefined && responsables[element.workers] != undefined){
                                        responsables[element.workers].total++;
                                        if(tempactivity.checkActivity == true){
                                            responsables[element.workers].completed++;
                                        }
                                    }
                                }
                                
                            }
                        }); 
                        // activities = activities;
                        // console.log("on snap test",activities);   
                    });
            });
            
        }
    }
    

    // const top = tweened(0, {
    //     duration: 1000,
    //     easing: quartInOut
    // });
    const top = writable(0);



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
  
</script>
<svelte:window bind:scrollY={$top} />
<div class="page-content modal-body resize">
    <!-- <TitleBar title="Tarjeta de Actividades Individual" base="Inventario" /> --> 
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    
                    <div class="row">
                        <div class="col-12">
                            <h2>Cierre de turno - {today.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</h2>
                            <h3>Encargado piso - Grupo {$profile?.group ?? "No asignado"}</h3>
                        </div>
                        {#each Object.keys(responsables) as r}
                        
                            {#if r == $fbuser.uid && responsables[r] != undefined}
                            <div class="col-12">
                                <div class="frame">
                                    <div class="scorecard">
                                      <div>
                                        <h2 class="text-title">Tu calificación</h2>
                                        <h3 class="text-win">Actividades completadas {responsables[r].completed}</h3>
                                        <p class="text-total">Actividades a tiempo: {responsables[r].completed}</p>
                                        <p class="text-total">Total de actividades: {responsables[r].total}</p>
                                        <p class="text-total">Observaciones importantes a reportar en el turno:<br /><textarea /></p>
                                        <button on:click={()=>{view = 0;}} class="btn btn-sm {view == 0 ?'btn-primary':'btn-outline-primary'}">Cierre de turno</button>
                                      </div>
                                      
                                      <div
                                        class="scorewin">
                                        <div class="img">
                                          <h1 class="text-white text-2xl">{responsables[r].total == 0 ? '0':(responsables[r].completed * 100 / responsables[r].total).toFixed(0)}</h1>
                                        </div>
                                      </div>
                                    </div>
                            
                                  </div>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
.frame{
    padding: 1rem; 
    width: 100%; 
    transition-duration: 500ms; 
}
.frame:hover {
 --transform-scale-x: 1.05;
--transform-scale-y: 1.05; 
 }
.scorecard{
    display: flex; 
    padding: 1rem; 
    justify-content: space-between; 
    align-items: center; 
    border-radius: 0.5rem; 
    background-color: #ffffff; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
}
.scorewarning{
    display: flex; 
justify-content: center; 
align-items: center; 
border-radius: 9999px; 
border-width: 2px; 
border-color: #ffffff; 
border-style: dashed; 
width: 8rem; 
height: 8rem; 
 background-image: linear-gradient(to top right, var(--tw-gradient-stops)); 
background-color: #F59E0B; 
background-color: #FBBF24; 
box-shadow: 0 25px 50px -12px #FBBF24; 
}
.scorewin {
    display: flex; 
justify-content: center; 
align-items: center; 
border-radius: 9999px; 
border-width: 2px; 
border-color: #ffffff; 
border-style: dashed; 
width: 8rem; 
height: 8rem; 
background-image: linear-gradient(to top right, var(--tw-gradient-stops)); 
background-color: #10B981;  
box-shadow: 0 25px 50px -12px #4ade80; 

}
.text-win{
    margin-top: 0.5rem; 
font-size: 1.25rem;
line-height: 1.75rem; 
font-weight: 700; 
color: #10B981; 

}
.text-total {
    font-size: 0.875rem;
line-height: 1.25rem; 
font-weight: 600; 
color: #9CA3AF; 

}
.text-title{
    font-size: 1.125rem;
line-height: 1.75rem; 
font-weight: 700; 
color: #111827; 
}
.scorewin .img {
    background-image: url("/assets/images/win2.gif");
    width: 100%;
    height: 100%;
    display: flex; 
justify-content: center; 
align-items: center;
}
</style>