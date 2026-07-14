<script>
import { onMount, onDestroy  } from 'svelte';
import Select from 'svelte-select';
import swal from 'sweetalert';
import { branches, addBranches } from './branches';

 export let value = "";
 export let inlist = false;
 export let onlyfields = false;
 export let baseId="";
 export let fields = [];
 export let excludeIds= [];
 export let allTag = "Seleccionar ...";
 export let withStyle = true;
 export let onSelect = null;
 export let canAdd = false;
 export let filter = (row)=>{return true;};
 let name;
 let rows;
 let allRows;
 let valueObject;

   onMount(() => {
         // Select2
        //  if(!inlist){
        //   jQuery("#select-branches"+baseId).select2();
        //   jQuery("#select-branches"+baseId).on("select2:select",function(e){
            
        //     value= e.params.data.id;
        //     if(onSelect != null && typeof onSelect === 'function'){
        //       //console.log(e.params);
        //       $branches.forEach(element => {
        //         if(element.id == e.params.data.id){
        //           onSelect(element);
        //           console.log(element);
        //         }
        //       });
              
        //     }
          // });
        // }
        
   });
   
   $: value, filter , updateSelect2();
   $: valueObject, handleSelect();

function updateSelect2(){
  rows = [];
 // let found = false;
 for (let d = 0; d < allRows.length; d++) {
    const element = allRows[d];
    const op = {value:element.id, label:element.name};
    if(!excludeIds.includes(element.id) && filter(element)){
      
      if(element.id == value){
        valueObject = op;
      }
      rows.push(op);
    }
    
  }
}
function handleSelect(){
  if(valueObject == undefined || valueObject.value == undefined){
    return;
  }
  //console.log(val);
  value = valueObject.value;
  if(onSelect != null && typeof onSelect === 'function'){
    allRows.forEach(element => {
                if(element.id == value){
                  onSelect(element);
                  //console.log(element);
                }
              });
  }
}

function handleClear(event) {
  value = "";
}

const unsubscribe = branches.subscribe(data => {
  
  allRows = data;
  updateSelect2();
});

onDestroy(unsubscribe);

function addOption(){
  swal({
                title: 'Añadir Nuevo',
                content:"input",
                showCancelButton: true,
                buttons:["Cancelar","Guardar"],
                showLoaderOnConfirm: true,
                confirmButtonColor: "#3b5de7",
                cancelButtonColor: "#f46a6a",
                preConfirm: function (name) {
                  
                    
                },
                allowOutsideClick: false
            }).then(function (name) {
              console.log(name); 
              if(name != null){
                var values = {
                    name : name
                  };

                  // db.collection("branches")
                  //   .add(values)
                    addBranches(values).then((rid)=>{
                      value = rid;
                      swal({
                    icon: 'success',
                    title: 'Registro grardado!',
                    html: 'Se agregó correctamente '// + name.value
                })
              });
                
              }
                
            });
}

</script>
                  <div class="{withStyle?'form-group':''}">
                    {#if inlist}
                      {#each $branches as row}
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
                    <Select items={rows} bind:value={valueObject} on:clear={handleClear}></Select>
                        <!-- <select id="select-branches{baseId}" bind:value={value} class="form-control select2"  >
                          <option value="">{allTag}</option>
                            {#each rows as row}
                              {#if !excludeIds.includes(row.id) && filter(row)}
                                <option value={row.id} selected={row.id == value}>{row.name}</option>
                              {/if}
                            {/each}
                      </select> -->
                      {#if canAdd}
                        <button type="button" class="btn btn-outline-secondary waves-effect waves-light" on:click={addOption}>
                          <i class="bx bx-plus font-size-16 align-middle mr-2"></i> Agregar
                        </button>
                      {/if}
                      {/if}
                  </div>