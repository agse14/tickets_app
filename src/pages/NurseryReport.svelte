<script>
    import TitleBar from "../TitleBar.svelte";
    import { pop } from "svelte-spa-router";
    import {branches} from "../controls/branches.js";
    import {patients} from "../controls/patients.js";
    import { onDestroy } from "svelte";

    export let params = {};
    export let onBack = ()=> {
        pop();
    }

    let loading;
    let query;
    let weekNew = [];
    let registros = {};
    let patientId = params.bid;
    let cdate = DateTime.local()
            .setLocale("es-mx").startOf('week');
            console.log(cdate);

    let patient = {};
    patients.subscribe((pats)=>{
        console.log("got patients");
        pats.forEach(element => {
                    if(patientId == element.id){
                        patient = element;
                        $branches.forEach(element => {
                            if(patient.branch == element.id){
                                patient.branchName = element.name
                            }
                        });
                    }
                });
    });
    

    $: loadFireStore();

    function loadFireStore(){
        console.log("patientId", patientId);
        query = db.collection("nursery")
        .where('patientName',"==",patientId)
        .orderBy('added','asc')
        .get()
        .then((result) => {
            registros = {};

            result.forEach((doc) => {
                
                let registro = doc.data();
                registro.id = doc.id;
                // console.log(registro);
                // console.log(registro.added);
                //registro.added = DateTime.fromJSDate(registro.added.toDate());
                // registro.added = luxon.DateTime.fromISO(registro.added).toISODate();
                
                // registros.push(registro);
                // console.log(registro.added);
                
                
                
                
                // let dId = DateTime.fromISO(registro.added).toISODate();
                // console.log("registro",registro, dId);
                registros[registro.date] = registro;
            });

            registros = registros;
            console.log("registros",registros);
        })
        
    }

    onDestroy(()=>{
        // if(query != undefined){
        //     query();
        // }
    });

    initWeek();

    function initWeek() {
    //let dayId = cdate.toISODate();
    //ESTO solo jala cuando ya se habia asignado una semana
    for (let wd = 0; wd < weekNew.length; wd++) {
        const element = weekNew[wd];
        if(element.unsub != undefined){
            element.unsub();
            element.unsub = null;
        }
    }

    //reseteo la semana
    weekNew = [];
    
    // me voy del lunes al dia 7
    for (let index = 0; index < 7; index++) {
        // al dia de inicio de semana le sumo index dias
        let dayNext = cdate.plus({days: index});
        //saco el id
        const dId = dayNext.toISODate();
        // console.log(dId);
        //carga las asignaciones de la semana
        // var unsubwek= db.collection("asignments").where('dayId',"==",dId).onSnapshot((querySnapshot) => { 
        //     for (let wd = 0; wd < weekNew.length; wd++) {
        //         const element = weekNew[wd];
        //         if(element.id == dId){

        //             element.loading = false;
        //             let foundDoc = false;
        //             // console.log('found assigments '+dId, querySnapshot.size);
        //             querySnapshot.forEach(function(doc) {
        //                     // doc.data() is never undefined for query doc snapshots
        //                     const data = doc.data();
                            
        //                 });
        //         }
        //     }
            
            // weekNew = weekNew;
        //    console.log(weekNew)
        // });
        
        weekNew.push({
            date: dayNext,
            id: dId,
            // unsub: unsubwek,
            asigned:[],
            added:false,
            loading: true
        });
    }
    // console.log('posAsign',posAsign);
    weekNew = weekNew;
    weekNew.forEach(element => {
        console.log(element.id);
    });
    
}

    // function prevWeek(){
    // cdate = cdate.minus({days: 7});
    // // console.log(cdate);
    // initWeek();
    // }       

    // function nextWeek(){
    //     cdate = cdate.plus({days: 7});
    //     // console.log(cdate);
    //     initWeek();
    // } 

    function cancel() {
        onBack();
    }
    // console.log(registros[registro.added]);
</script>

<div class="page-content modal-body">
    <TitleBar title="Impresión Enfermería" base="Inventario" />
    <form id="form">
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <button on:click={() => window.print() } class="btn btn-print waves-effect waves-light no-print"><i class="bx bx-printer font-size-16 align-middle mr-2"></i>Imprimir</button>
                        <button type="button"
                        on:click={cancel}
                        class="btn btn-light waves-effect waves-light no-print"
                        disabled={loading}>
                        Cancelar</button>
                    

                        <div class="card-body">
                            <div class="row mb-4">
                                <div class="col"></div>
                                <div class="col-5 text-center"><h3>Reporte de Enfermeria</h3></div>
                                <div class="col"></div>
                            </div>
                            <div class="timeline-count p-4 over">
                                <!-- Timeline row Start -->
                                <div class="row over">
                                    <div class="timeline-box col">
                                        <div class="timeline-spacing">
                                            <div class="item-lable bg-secondary rounded">
                                                <p class="text-center text-white">Datos</p>   
                                            </div>
                                            
                                            <div class="bg-light p-4 rounded mx-1">
                                                <div class="col">
                                                    <h6 class="text-center">{patient.name ?? ''}</h6>
                                                </div>
                                                <div class="text-muted mb-0">   
                                                    
                                                    <div class="row">
                                                        <div class="col-12">
                                                            Edad: 
                                                        </div>
                                                        <div class="col-12">
                                                            Servicio Emergencia:
                                                        </div>
                                                    
                                                        <div class="col-12">
                                                            Afiliación: 
                                                        </div>
                                                    
                                                        <div class="col-12">
                                                            Diagnóstico: 
                                                        </div>
                                                    
                                                        <div class="col-12">
                                                            Signos vitales:
                                                        </div>
                                                        <div class="col-12">
                                                            Dxs: 
                                                        </div>
                                                    
                                                        <div class="col-12">
                                                            Alimentación: 
                                                        </div>
                                                        <div class="col-12">
                                                            Evacuación: 
                                                        </div>
                                                        <div class="col-12">
                                                            Micción: 
                                                        </div>
                                                        <div class="col-12">
                                                            Cuidados Especiales: 
                                                        </div>
                                                        <div class="col-12">
                                                            Funcionalidad: 
                                                        </div>
                                                        <div class="col-12">
                                                            Peso: 
                                                        </div>
                                                        <div class="col-12">
                                                            Observaciones: 
                                                        </div>
                                                        <div class="col-12">
                                                            EVA: 
                                                        </div>
                                                    
                                                    </div>
                                                
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {#each weekNew as day}
                                        {@const registro = registros[day.id] != undefined ? registros[day.id]:{}}
                                        <div class="timeline-box col">
                                            <div class="timeline-spacing">
                                                <div class="item-lable bg-primary rounded">
                                                    <p class="text-center text-white">{day.date.weekdayLong} {day.date.day}</p>   
                                                </div>
                                                    <div class="bg-light p-4 rounded mx-1">
                                                        <div class="text-muted mb-0">   
                                                            
                                                            <div class="row">
                                                                <div class="col-12">
                                                                    Diagnóstico: {registro.diagnose ?? ''}
                                                                </div>
                                                            
                                                                <div class="col-12">
                                                                    Signos vitales: {registro.vitals ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    Dxs: {registro.dxs ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    Alimentación: {registro.feeding ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    Evacuación: {registro.evacuation ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    Micción: {registro.urination ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    Cuidados Especiales: {registro.specialCare ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    Funcionalidad: {registro.functionality ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    Peso: {registro.weight ?? ''} kg
                                                                </div>
                                                                <div class="col-12">
                                                                    Observaciones: {registro.observations ?? ''}
                                                                </div>
                                                                <div class="col-12">
                                                                    EVA: to review
                                                                </div>
                                                            
                                                            </div>
                                                        </div>
                                                    </div>
                                               
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
<style>
@media print {
    .page-content {
        size: landscape;
    }
    @page {
        size: landscape;
    }
}

</style>