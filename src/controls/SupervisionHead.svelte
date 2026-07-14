<script>
    import { link } from "svelte-spa-router";
    import ReportCard from "./ReportCard.svelte";
    import {branches as br} from "../controls/branches.js";
    import { permissions} from "../stores.js";
    import { onDestroy} from 'svelte';
    import 'iconify-icon';

    export let branches = "";
    export let data = [];
     let incidents = [];
     let current = {};
    let typeI = 0;
    let typeS = 0;
    let typeSafe = 0;
    let typeN = 0;
    let typeP1 = 0;
    let typeP2 = 0;
    let unsubscribe;
    

    onDestroy(() => {
		if(unsubscribe != null && unsubscribe != undefined){
            unsubscribe();
        }
	});

    
    let query = db.collection("incident").orderBy('added','desc');
    if(branches != ""){
        query = query.where("branches","==",branches);
    }
    // query.where("status","==",branches);
    function processData(){
    // unsubscribe = query.onSnapshot(async (querySnapshot) => {
        const tmp = [];
        typeI =0;
        typeS=0;
        typeSafe = 0;
        typeN=0;
        typeP1=0;
        typeP2=0;
        current = {};
        for(var doc of data){
            if(doc.status > 1){
                continue;
            }
            current[doc.branches] = true;
        // querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const tempsupervision = doc;
            //tempsupervision.id = doc.id;
            if(tempsupervision.status == 2){
                return;
            }
            if(tempsupervision.type == 0){
                typeI++;
            }
            if(tempsupervision.type == 1){
                typeS++;
            }
            if(tempsupervision.type == 2){
                typeSafe++;
            }
            if(tempsupervision.type == 3){
                typeN++;
            }
            if(tempsupervision.type == 4){
                typeP1++;
            }
            if(tempsupervision.type == 5){
                typeP2++;
            }
            tmp.push(tempsupervision);
        }
            
        // });
        incidents = tmp;
        // current = incidents;
    }
    // });

    $: data, checkCurrent();
    function checkCurrent() {
        processData();
        // for (let index = 0; index < data.length; index++) {
        //     const element = data[index];

        //     if(element.added != undefined && element.branches != undefined){
        //         const date = DateTime.fromJSDate(element.added.toDate());
        //         if(date.weekNumber == DateTime.local().weekNumber){
        //             current[element.branches] = true;
        //         }
                
        //     }
        
        // }
        
        // current = current;
    }
    
    

</script>
{#if $permissions.admin  || $permissions.manager}
    <h1>Reportes Activos</h1>
        <div class="row">
            <!-- <div class="col-12"><a href={"/incidents"} use:link class="btn btn-secondary waves-effect">Ver Todos</a> <a href={"/addincident"} use:link class="btn btn-secondary waves-effect">Nuevo Reporte</a></div> -->
            <div class="col-md-4 col-6">
                <ReportCard label="Inconformidades y Reclamos" number={typeI} url="/incidents" />
            </div>
            <div class="col-md-4 col-6">
                <ReportCard label="Casos de salud delicados" number={typeS} url="/incidents" />
            </div>
            <div class="col-md-4 col-6">
                <ReportCard label="Reporte de seguridad" number={typeSafe} url="/incidents" />
            </div>
            <div class="col-md-4 col-6">
                <ReportCard label="Accidente" number={typeN} url="/incidents" />
            </div>
            <div class="col-md-4 col-6">
                <ReportCard label="Problemas con personal" number={typeN} url="/incidents" />
            </div>
            <div class="col-md-4 col-6">
                <ReportCard label="Problemas con familiar" number={typeN} url="/incidents" />
            </div>
        </div>
    <hr />
{/if}
<div class="row">
    <div class="col-12">Incidentes Reportads</div>
</div>
<div class="row mb-2">
    {#if $permissions.admin || $permissions.manager}
        {#each $br as branch}
            {#if !["A4JNT4BK8ScnTNhsF9XZ","N6uR7g3SkrkoAuR2jNtY"].includes(branch.id)}
            <div class="col mb-2">
                <a href="/incidents/" use:link class="avatar-title {current[branch.id] != true? 'bg-soft-success text-success':'bg-soft-warning text-warning'} rounded text-center p-2">
                    
                    <iconify-icon icon="ph:warning-duotone" />
                    <br/>
                    {branch.name}</a>
                
            </div>
            {/if}
        {/each}
    {/if}
</div>
<!-- <div class="row">
    <div class="col-4"><a href="/addsupervision" use:link class="btn btn-primary">Realizar supervision</a></div>
    <div class="col"> </div>
    {#if $permissions.admin}
    <div class="col-4"><a href="/supervision_qr/all" use:link class="btn btn-secondary">Imprimir códigos QR</a></div>
    {/if}
    
</div> -->
<hr />
<h3>Estatus de incidentes</h3>
<style>
    .avatar-title{
        display: block;
    }
</style>