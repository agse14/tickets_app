<script>
import { onMount, onDestroy  } from 'svelte';
import { positions } from './positions.js';

 export let value = "";
 export let inlist = false;
 export let onlyfields = false;
 export let baseId="";
 export let fields = [];
 export let excludeIds= [];
 export let allTag = "Seleccionar ...";
 export let withStyle = true;
 let name;
 let rows;

   onMount(() => {
         // Select2
         if(!inlist){
          jQuery("#select-position"+baseId).select2();
          jQuery("#select-position"+baseId).on("select2:select",function(e){
            value= e.params.data.id;
          });
         }
        
   });
   
$: value, updateSelect2();

function updateSelect2(){
  if(!inlist){
    setTimeout(function(){
      jQuery("#select-position"+baseId).trigger("change");
    //console.log("onUpdate");
    }, 500);
  }
}

const unsubscribe = positions.subscribe(data => {
  
  rows = data;
  if(!inlist){
    setTimeout(function(){
      jQuery("#select-position"+baseId).trigger("change");
    //console.log("onUpdate");
    }, 500);
  }
});

onDestroy(unsubscribe);

</script>
                  <div class="{withStyle?'form-group':''}">
                    {#if inlist}
                      {#each $positions as row}
                        {#if row.id == value}
                          {#if !onlyfields}
                            {#if withStyle}
                              <h5>{row.name}</h5>
                            {:else}
                              {row.name}
                            {/if}
                          {/if}
                          {#each fields as field}
                              {#if row[field] == undefined}
                                {#if field == 'avatar'}
                                <div class="avatar-md">
                                  <span class="avatar-title rounded-circle bg-soft-primary text-primary">
                                    {row.name.substring(0,2)}
                                      </span>
                                  </div>
                                {/if}
                              {:else}
                                <p>{row[field]}</p>
                              {/if}
                          {/each}
                        {/if}
                      {/each}
                    {:else}
                        <select id="select-position{baseId}" bind:value={value} class="form-control select2"  >
                          <option value="">{allTag}</option>
                            <!-- value el ID y en nombre el producto  -->
                            {#each rows as row}
                              {#if !excludeIds.includes(row.id)}
                                <option value={row.id} selected={row.id == value}>{row.name}</option>
                              {/if}
                            {/each}
                      </select>
                      {/if}
                  </div>