<script>
    import { onMount, onDestroy  } from 'svelte';
    import { workers } from './workers.js';
    
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
     export let branch = "";
     export let shift = ""; 

     let name;
     let rows;

       onMount(() => {
             // Select2
             if(!inlist){
              jQuery("#select-workers"+baseId).select2();
              jQuery("#select-workers"+baseId).on("select2:select",function(e){
                
                value= e.params.data.id;
                if(onSelect != null && typeof onSelect === 'function'){
                  //console.log(e.params);
                  $workers.forEach(element => {
                    if(element.id == e.params.data.id){
                      onSelect(element);
                      console.log(element);
                    }
                  });
                  
                }
              });
             }
            
       });
       
    $: value, updateSelect2();
    
    function updateSelect2(){
      if(!inlist){
        setTimeout(function(){
          jQuery("#select-workers"+baseId).trigger("change");
        //console.log("onUpdate");
        }, 500);
      }
    }
    
    const unsubscribe = workers.subscribe(data => {
      
      rows = data;
      if(!inlist){
        setTimeout(function(){
          jQuery("#select-workers"+baseId).trigger("change");
        //console.log("onUpdate");
        }, 500);
      }
    });
    
    onDestroy(unsubscribe);
    
    function addOption(){
      Swal.fire({
                    title: 'Añadir Nuevo',
                    input: 'text',
                    showCancelButton: true,
                    confirmButtonText: 'Guardar',
                    showLoaderOnConfirm: true,
                    confirmButtonColor: "#3b5de7",
                    cancelButtonColor: "#f46a6a",
                    preConfirm: function (name) {
                      var values = {
                        name : name,
                        added : timenow
                      };
    
                        return db.collection("workers")
                        .add(values);
                        /*new Promise(function (resolve, reject) {
                            setTimeout(function () {
                                if (email === 'taken@example.com') {
                                    reject('This email is already taken.')
                                } else {
                                    resolve()
                                }
                            }, 2000)
                        })*/
                    },
                    allowOutsideClick: false
                }).then(function (name) {
                  console.log(name); 
                  if(name.dismiss == undefined){
                    Swal.fire({
                        type: 'success',
                        title: 'Registro guardado!',
                        html: 'Se agregó correctamente '// + name.value
                    });
                  }
                    
                });
    }
    
    </script>
                      <div class="{withStyle?'form-group':''}">
                        {#if inlist}
                          {#each $workers as row}
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
                            <select id="select-workers{baseId}" bind:value={value} class="form-control select2"  >
                              <option value="">{allTag}</option>
                                <!-- value el ID y en nombre el producto  -->
                                {#each rows as row}
                                    {#if row.status == 'Activo' }
                                        {#if !excludeIds.includes(row.id)}
                                            <option value={row.id} selected={row.id == value}>{row.name} {shift}</option>
                                        {/if}
                                    {/if}
                                {/each}
                          </select>
                          {#if canAdd}
                            <button type="button" class="btn btn-outline-secondary waves-effect waves-light" on:click={addOption}>
                              <i class="bx bx-plus font-size-16 align-middle mr-2"></i> Agregar
                            </button>
                          {/if}
                          {/if}
                      </div>