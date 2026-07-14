<script>
    import { link } from "svelte-spa-router";
    import ReportCard from "./ReportCard.svelte";
    import {branches as br} from "../controls/branches.js";
    import { permissions} from "../stores.js";
    import { onDestroy} from 'svelte';
import { fun } from "../callable";

    export let branches = "";
    export let data = [];
    export let title = "Reporte de vacantes";
     let incidents = [];
     let current = {};
    let typeActive = 0;
    let typeEnded = 0;
    let typeCancel = 0;
    let typePendingApproval = 0;
    let typeToCover = 0;
    let typeApproved = 0;
    let unsubscribe;
    

    onDestroy(() => {
		if(unsubscribe != null && unsubscribe != undefined){
            unsubscribe();
        }
	});

    
    // let query = db.collection("incident").orderBy('added','desc');
    // if(branches != ""){
    //     query = query.where("branches","==",branches);
    // }
    
    // unsubscribe = query.onSnapshot(async (querySnapshot) => {
    //     const tmp = [];
    //     typeI =0;
    //     typeS=0;
    //     typeSafe = 0;
    //     typeN=0;
    //     typeP1=0;
    //     typeP2=0;
    //     querySnapshot.forEach((doc) => {
    //         // console.log(`${doc.id} => ${doc.data()}`);
    //         const tempsupervision = doc.data();
    //         tempsupervision.id = doc.id;
    //         if(tempsupervision.status == 2){
    //             return;
    //         }
    //         if(tempsupervision.type == 0){
    //             typeI++;
    //         }
    //         if(tempsupervision.type == 1){
    //             typeS++;
    //         }
    //         if(tempsupervision.type == 2){
    //             typeSafe++;
    //         }
    //         if(tempsupervision.type == 3){
    //             typeN++;
    //         }
    //         if(tempsupervision.type == 4){
    //             typeP1++;
    //         }
    //         if(tempsupervision.type == 5){
    //             typeP2++;
    //         }
    //         tmp.push(tempsupervision);
            
            
    //     });
    //     incidents = tmp;

    // });

    $: data, checkCurrent();
    function checkCurrent() {
        typeActive = 0;
        typeEnded = 0;
        typeCancel = 0;
        typePendingApproval = 0;
        typeToCover = 0;
        typeApproved = 0;
        
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            // console.log(element);
            if (element.status == 0) {
                typeActive++;
            }
            if (element.status == 1) {
                typeEnded++;
            }
            if (element.status == 2) {
                typeCancel++;
            }
            if (element.status == 3) { // Por Aprobar
                typePendingApproval++;
            }
            if (element.status == 4) { // Por Cubrir
                typeToCover++;
            }
            if (element.status == 5) { // Aprobada
                typeApproved++;
            }
        }

        current = current;
    }
    
    

</script>
<h3>{title}</h3>
<div class="row">
    <div class="col-md-4 col-6">
        <ReportCard label="Activas" number={typeActive} url="/incidents" warning={false} />
    </div>
    <div class="col-md-4 col-6">
        <ReportCard label="Cubiertas" number={typeEnded} url="/incidents" warning={false} />
    </div>
    <div class="col-md-4 col-6">
        <ReportCard label="Canceladas" number={typeCancel} url="/incidents" warning={false} />
    </div>
    <div class="col-md-4 col-6">
        <ReportCard label="Por Aprobar" number={typePendingApproval} url="/incidents" warning={true} />
    </div>
    <div class="col-md-4 col-6">
        <ReportCard label="Por Cubrir" number={typeToCover} url="/incidents" warning={false} />
    </div>
    <div class="col-md-4 col-6">
        <ReportCard label="Aprobada" number={typeApproved} url="/incidents" warning={false} />
    </div>
</div>

    <!-- <div class="col-md-4 col-6">
        <ReportCard label="Accidente" number={typeN} url="/incidents" />
    </div>
    <div class="col-md-4 col-6">
        <ReportCard label="Problemas con personal" number={typeN} url="/incidents" />
    </div>
    <div class="col-md-4 col-6">
        <ReportCard label="Problemas con familiar" number={typeN} url="/incidents" />
    </div> -->
<!-- </div> -->

<style>
    .avatar-title{
        display: block;
    }
</style>