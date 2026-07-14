<script>
import { onMount } from 'svelte';
import { products } from './controls/products.js';

 export let value = "";
 let name;

   onMount(() => {
         // Select2
        jQuery(".select2").select2();
        jQuery(".select2").on("select2:select",function(e){
          value= e.params.data.id;
        });
   });
  
</script>

<div class="row">
  <div class="col-lg-6">
      <div class="card">
          <div class="card-body">

              <h4 class="card-title">Select</h4>
              
                
              <form>
                  <div class="form-group">
                      <label class="control-label" for="select-product">Seleccionar producto</label>
                      
                       
                        <select id="select-product" bind:value={value} class="form-control select2"  >
                          <option  >Seleccionar ... </option>
                          
                          
                            <!-- value el ID y en nombre el producto  -->
                            {#each $products as product}
                            <option value={product.id} >{product.name}</option>
                            {/each}
                              
                              
                          

                      </select>
                      <p>Producto Seleccionado {value}</p>
                  </div>
                  <!-- <div class="form-group mb-0">
                      <label class="control-label">Multiple Select</label>

                      <select class="select2 form-control select2-multiple" multiple="multiple" data-placeholder="Elegir ...">
                        <optgroup label="Productos">
                          
                          {#each $products as product}
                          <option value={product.id}>{product.name}</option>
                          {/each}
                            
                            
                        </optgroup>
                      </select>
                      
                  </div> -->

              </form>

          </div>
      </div>
      <!-- end select2 -->

  </div>

  
</div>


<!-- end row -->