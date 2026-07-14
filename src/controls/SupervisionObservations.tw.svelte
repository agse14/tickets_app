<script>
import {steps, getIcon, stepArray} from './supervision_cats.js';
import { fbuser} from "../stores.js";
    import { branches } from './branches.js';
    import IncidentTypeListSelect from './IncidentTypeListSelect.svelte';

export let data = {};
export let inlist = true;
export let onAction = ()=>{};
let text = "";
let incidents=[];
let allChecked = false;
let allAreas = true;
let subject = "";

$:data, reload();
$:incidents, processChecked();

function reload(){
    if(inlist || data.branches == undefined || data.branches == ""){
        return;
    }
    loadIncidents();
}
function addObs(){
    if(text == ""){
        return;
    }
    if(data.obs == undefined){
        data.obs = [];
    }
    data.obs.push(text);
    db.collection("supervision_obs").add({
                                name: text,
                                branches: data.branches,
                                added:timenow,
                                status: 0,
                                completed: false,
                                createdBy: $fbuser.uid,
                                createdName: $fbuser.displayName ?? '',
                            });
    data = data;
    text = "";
}
function next(){
    if(allAreas){
        db.collection("supervision_week").add({
            branches: data.branches,
            added: new Date(),
            subject: subject,
            status: 0,
            completed: false,
            createdBy: $fbuser.uid,
            createdName: $fbuser.displayName ?? '',
        });
    }
        onAction();
}


function processChecked(){
    // console.log("processChecked", incidents);
    allChecked = true;
    incidents.forEach((i)=>{
        if(i.subject == undefined || i.responsable == undefined){
            return;
        }
        if(i.checked == undefined || i.checked == false){
            allChecked = false;
        }
    });

}

function loadIncidents(){

    incidents = [];
    db.collection("incident").where("branches", "==", data.branches).where("status", "==", 0).get().then((querySnapshot) => {
        console.log("got incidents",querySnapshot.size);
        querySnapshot.forEach((doc) => {
            incidents.push(doc.data());
        });
        incidents = incidents;
    });
}
</script>
{#if data.branches != undefined && data.branches != ""}
    A revisar:
    <ul>
        {#if data.obs != undefined}
            {#each data.obs as ob}
                <li>{ob}</li>
            {/each}
        {/if}
        <li>
            <p><b>Agregar Observaciones de Mantenimiento</b></p>
            <p class="flex flex-row ">
            <input class="form-control grow" type="text" bind:value={text} />
            <button type="button" class="btn btn-secondary grow-0" on:click={addObs}>Agregar</button></p>
        </li>
    </ul>
    <p></p>
    <hr class="my-4" />
    <p></p>
    {#if allAreas}
    <h4 class="text-xl font-bold text-slate-400">Revisión con encargada</h4>
    <div class="flex flex-col p-3 rounded-lg shadow-lg bg-white border border-gray-200 gap-3 bg-gradient-to-br from-white to-gray-100">
            <h5 class=" text-green-400 ">Revisión de Incidentes reportados</h5>
            <ul>
            {#each incidents as i}
                {#if i.subject != undefined && i.responsable != undefined}
                <li><div class="flex flex-col">
                    <div class="flex flex-row gap-2">
                    <div class="inline-flex items-center">
                        <label class="flex items-center cursor-pointer relative">
                          <input bind:checked={i.checked} defaultChecked type="checkbox" class="peer h-6 w-6 cursor-pointer transition-all appearance-none rounded-full bg-slate-100 shadow hover:shadow-md border checked:bg-green-800 checked:border-green-800 border-green-300" id="check-custom-style" />
                          <span class="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                          </span>
                        </label>
                      </div>
                     <div class="flex flex-col gap-2 items-start">
                    <p>{i.responsable}: {i.subject}.</p>
                    <div class="badge bg-slate-200 text-info rounded-md"><IncidentTypeListSelect value={i.type} inlist={true} /></div>
                </div> 
                </div>
                </div>
                </li>
                {/if}
            {/each}
            </ul>
            <h5>Acuerdos:</h5>
            <textarea class="form-control" rows="3" bind:value={subject}></textarea>
    </div>
    {/if}
    <div class="row">
        <div class="col-12"><button type="button" class="btn btn-primary" disabled={allAreas && !allChecked} on:click={next}>{#if allAreas}Cerrar Revisión{:else}Guardar Revisión{/if}</button>
        </div>
    </div>
{:else}
    Favor de seleccionar una estancia para iniciar
{/if}
<svelte:head>
    <link href="assets/css/output.css" rel="stylesheet" />
</svelte:head>