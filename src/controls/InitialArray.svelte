<script>
import { each } from "svelte/internal";
import { fun } from "../callable";


export let value = [];
let label = "";
let editId = null;
let editVal = "";

function add(){
    if(label != ""){
        value.push(label);
        value = value;
        label = "";
    }
}

function remove(val){
    var index = value.indexOf(val);
    if (index !== -1) {
        value.splice(index, 1);
        value = value;
    }
}
function edit(idx){
        if(editId == null){
            editId = idx;
            editVal =value[idx];
        }else{
            value[idx] = editVal;
            value = value;
            editVal = "";
            editId = null;
        }
        
    }
</script>
<ul>
    {#each value as val, idx}
        <li>{#if editId != idx} {val}{:else}<input type="text" bind:value={editVal} />{/if}  
            <button type="button" on:click={()=>{edit(idx)}} class="btn btn-outline-success waves-effect waves-light"><i class="bx bx-save font-size-14 align-middle"></i>
            </button>
            <button type="button" on:click|preventDefault={()=>{remove(val)}} class="btn btn-outline-danger waves-effect waves-light"><i class="bx bx-x font-size-14 align-middle"></i>
        </button></li>
    {/each}
    
</ul><input bind:value={label} /><button  type="button" on:click|preventDefault={add} class="btn btn-outline-success waves-effect waves-light">+</button>
