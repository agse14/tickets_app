<script>

    
import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
import {steps, getIcon, stepArray, getLabel} from './supervision_cats.js';
import {Html5QrcodeScanner} from "html5-qrcode";
import { branches } from './branches.js';
import { fbuser} from "../stores.js";
import { checklist } from '../Utils/checks.js';
import 'iconify-icon';

	const dispatch = createEventDispatcher();

	function fieldUpdate() {
        data.step = step;
		// dispatch('change', {
		// 	value: step
		// });
	}
    
    export let data = {};
    export let inlist = false;
    let error = '';
    let step = undefined;
    let editing = false; 
    //let steps = 7;
    let sResults = [];
    let rooms = [];
    let grade = 0;
    let init = false;
    let html5QrcodeScanner;
    let scanned = [];
    let obs = [];
    
    async function loadRooms(){
        // console.log("data",data);
        if(data.branches == undefined){
            return;
        }
        var roomData = await db.collection("room_inventory").where("branches","==",data.branches).orderBy("name").get();
        rooms = [];
        roomData.docs.forEach(element => {
            var el = element.data();
            el.id = element.id;
            rooms.push(el);
        });
        rooms = rooms;
    }

    loadRooms();
    $: data, dataChange(); 
    
    function dataChange(){
        // console.log(step, data);
        if(data.added != undefined){
            scanned = [...Array(steps).keys()];
            editing = true;
        }
        if((inlist || data.added != undefined) && !init){
            //console.log(step);
            checkAllSteps();
            init = true;
            
        }
        if(!inlist && rooms.length == 0){
            loadRooms();
        }
    }
    
    function next(){
        step++;
        if(step >= steps){
            //console.log("action")
            dispatch('action', 'save');
            return;
        }
        
        fieldUpdate();
        checkStep();
        goTop();

    }
    function toStep(s){
        step = s;
        //addScanned(step);
        fieldUpdate();
        checkStep();
        goTop();
    }
    function goTop() {
        document.body.scrollIntoView();
    }
    

    function checkStep(){
        if(step != undefined){
                    let res = true;
                    for (let index = 0; index < stepArray[step].length; index++) {
                        const element = stepArray[step][index];
                        let txt = "";
                        if(element.id.startsWith("clean_0") && (data[element.id] == undefined || data[element.id] == 0)){
                            res = false;
                            //console.log(element.id, data);
                            if(step == 3 && data.room != undefined && data.room != ""){
                                txt = "Cuarto "+data.room+": "+element.label;
                            }else{
                                txt = getLabel(step)+": "+element.label;
                            }
                            
                        }
                        if(element.id.startsWith("check") && (data[element.id] == 1)){
                            res = false;
                            //console.log(element.id, data);
                            txt = getLabel(step)+": "+element.label;
                        }
                        if(txt != "" && !scanned.includes(step)){
                            obs.push(txt);
                            if(!editing){
                                db.collection("supervision_obs").add({
                                    name: txt,
                                    branches: data.branches,
                                    added:timenow,
                                    status: 0,
                                    completed: false,
                                    createdBy: $fbuser.uid,
                                    createdName: $fbuser.displayName ?? '',
                                });
                            }
                            
                        }
                    }
                    sResults[step]= {res:res};
            scanned.push(step);
            scanned = scanned;
        }
        data.obs = obs;
    }

    function checkAllSteps(){
        sResults = [];
        grade = 0;
        let obs = [];
        for (let s = 0; s < steps; s++) {
            if(s<=step || editing){ 
                let res = true;
                for (let index = 0; index < stepArray[s].length; index++) {
                    const element = stepArray[s][index];
                    if(element.id.startsWith("clean_0") && (data[element.id] == undefined || data[element.id] == 0)){
                        res = false;
                        //console.log(element.id, data);
                        obs.push(getLabel(s)+": "+element.label);
                    }
                    if(element.id.startsWith("check") && (data[element.id] == 1)){
                        res = false;
                        //console.log(element.id, data);
                        obs.push(getLabel(s)+": "+element.label);
                    }
                }
                if(res){
                    grade += 100/steps;
                }
                sResults.push({res:res});
                
            }
        };
        data.obs = obs;
        // console.log(sResults);
    }

    function loadScanner(){
        if(html5QrcodeScanner == undefined){
                html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: {width: 250, height: 250} },
            /* verbose= */ false);
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        }else{
            //html5QrcodeScanner.resume();
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        }
        
    }
    onDestroy(()=>{
        if(html5QrcodeScanner != undefined){
            html5QrcodeScanner.clear();
        }
       
    });

    async function onScanSuccess(decodedText, decodedResult) {
        // handle the scanned code as you like, for example:
        console.log(`Code matched = ${decodedText}`, decodedResult);
        if(!decodedText.startsWith('olivos:')){
            error = "QR no válido para Los Olivos";
            console.log(error);
            return;
        }
        let olivos = decodedText.split(",");
        if(olivos.length < 2){
            error = "QR no válido para supervisión";
            console.log(error);
            return;
        }
        data.branches = olivos[0].replace("olivos:","");
        let newstep = parseInt(olivos[1]);
        checkStep();

        if(olivos[2] != undefined){
            //has room number
            data.room = olivos[2];
            if(data.rooms == undefined){
                data.rooms = {};
            }
            data.rooms[olivos[2]] = true;
        }else{
            data.room = "";
        }
        
        step = newstep;
        //addScanned(step);
        fieldUpdate();
        error = "";
        //console.log(data.branches, step);

        await tick();
        document.querySelectorAll('h3')[1].scrollIntoView({
            behavior: 'smooth'
        });
        html5QrcodeScanner.clear();
    }

    function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // for example:
     //console.warn(`Code scan error = ${error}`);
    }

    // function addScanned(step){
    //     if(!scanned.includes(step)){
    //         scanned.push(step);
    //         scanned = scanned;
    //     }
    // }
    
</script>
{#if inlist}
<div class="row">
    
    <div class="col-12">Revisadas : {grade.toFixed(0)}/100</div>
    <div class="col-12 row">
    {#each checklist as check, cIdx}
        <div class="m-2 p-1 bg-success rounded">
            <p class="text-center text-white">
                {#if check.icon != undefined}
                 <iconify-icon icon={check.icon} style="font-size: 24px;"/>
                 {/if}
                 <span>{check.area}</span>
                        <i class="mdi mdi-check"></i>
                        <!-- <i class="mdi mdi-information"></i> -->
                
                
            </p>
        </div>
    {/each}
    {#each Array(steps) as _,s}
        {#if sResults[s]?.res != true}
                <div class="m-2 p-1 {sResults[s]?.res == true?'bg-success':'bg-warning'} rounded">
                    <p class="text-center text-white">
                        <i class="mdi {getIcon(s)}"></i>
                            {#if sResults[s]?.res == true}
                                <i class="mdi mdi-check"></i>
                            {:else}
                                <i class="mdi mdi-information"></i>
                            {/if}
                        
                    </p>
                </div>
            {/if}
    {/each}
</div>
</div>
{:else}
<!-- <div class="row mt-3 mb-3">
    {#each Array(steps) as _,s}
        <div class="timeline-box col">
            <div class="">
                <! -- {'on:click={()=>{toStep(s);}}'} -- >
                <div class="m-2 p-1 {s != step && !scanned.includes(s)?'bg-secondary':s == step && !editing?'bg-primary':sResults[s]?.res == true?'bg-success':'bg-warning'} rounded" >
                    <p class="text-center text-white">
                        <i class="mdi {getIcon(s)}"></i>
                        {#if scanned.includes(s) && (step != s || editing)}
                            {#if sResults[s]?.res == true}
                            <i class="mdi mdi-check"></i>
                            {:else}
                            <i class="mdi mdi-information"></i>
                            {/if}
                        {/if}
                    </p>
                </div> 
                <div class="timeline-line active"><div class="dot {s > step?'bg-secondary':'bg-primary'}"></div></div> 
            </div> 
        </div>
    {/each}
    
</div>
<div class="row mb-4">
    <div class="col-12">Cuartos a revisar</div>
    {#each rooms as room}
        <div class="col-1 room {data.rooms != undefined && data.rooms[room.name] ? 'ok': ''}">{room.name}</div>
    {/each}
</div> -->
<!-- <div class="row">
    <div class="col-12 text-center">
        {error}
        
        <div id="reader"></div>
        {#if data.branches == undefined || data.branches == ""}
            <h3>Capturar un código para empezar</h3>
        {/if}
        {#if steps == scanned.length-1}
            <button type="button" class="btn btn-primary btn-lg" on:click={next}>Guardar</button>
        {:else}
            <button type="button" class="btn-primary btn btn-lg" on:click={loadScanner}>Leer QR</button>
        {/if}
        
    </div>
</div> -->

{/if}
<style>
    .mdi {
        font-size: 24px;
    }
    .room {
        border: solid 1px #aaaaaa;
        border-radius: 5px;
        margin: 2px;
        font-size: 13px;
        padding: 0px;
        text-align: center;

    }
    .room.ok{
        background-color: darkseagreen;
        color:#fff;
    }
</style>