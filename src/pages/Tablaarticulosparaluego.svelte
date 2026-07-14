<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import { patients } from "../controls/patients.js";
  import PatientsSearchList from "../controls/PatientsSearchList.svelte";
  import ItemsOptions from "../controls/ItemsOptions.svelte"

  export let params = {};
  export let values = {};
  export let autoAdd = false;

  function addToTable(field, adderValues){
    if(values[field] == undefined){
      values[field] = [];
    }
    values[field].push(adderValues);
    values = values;
    adder = {};
  }
  function deleteFromTable(field, idx){
    if(values[field] != undefined){
        values[field].splice(idx,1);
      }
      values = values;
  }
</script>

<div class="page-content">
  <TitleBar title="Articulos" base="no se" />
  <div class="row">
	
    <div class="col">
      <div class="card">
      <div class="card-body">
      <h3>Artículos Personales</h3>
    
      <div class="form-group row"><div class="col-md-4 col-form-label">Artículos</div> <div class="col-md-8"> <ItemsOptions  /> </div></div>
      
            
      <div class="form-group row"><label for="nonlisteditems" class="col-12 col-form-label">Misceláneos</label> 
      
            
            <div className="col-12">
            <div class="table-responsive">
                                            <table class="table table-sm mb-0">
    
                                                <thead class="thead-light">
                                                    <tr>
                              <th>#</th>
                                                        <th>Misceláneos</th>
              
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                          {#if values.nonlisteditems != undefined}
                                                <tbody>
                          
                          {#each values.nonlisteditems as subfield, sfk}
                                                    <tr>
                                                        <th scope="row">{sfk+1}</th>
                                                       <td>{subfield.nonlisteditems}</td>
                                                        <td>
                              <button type="button" class="btn btn-outline-error" on:click={()=>{deleteFromTable('nonlisteditems', sfk);}}>x<i className="zmdi zmdi-plus"></i></button>
    
                               </td>
                                                    </tr>
                            {/each}
                                                </tbody>
                          {/if}
                          <tr id="addnonlisteditems">
                          <td>+</td>
                          <td>
      <input class="form-control " type="text" bind:value={adder.nonlisteditems} id="nonlisteditems" placeholder="Misceláneos"  />
    </td>
                            <td>
                              <div class="font-icon-wrapper">
                              <button type="button" class="btn btn-outline-success" on:click={()=>{addToTable('nonlisteditems', {nonlisteditems: adder.nonlisteditems});}}>+<i className="zmdi zmdi-plus"></i></button></div>
                            </td>
                          </tr>
                                            </table>
                                        </div>
                </div>
              </div>
    </div>
      </div>
      </div>
    </div>

</div>
