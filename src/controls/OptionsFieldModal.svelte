<script>
import FieldsRender from "./FieldsRender.svelte";
import FieldsType from "./FieldsType.svelte";
import InitialArray from "./InitialArray.svelte";
import InitialMap from "./InitialMap.svelte";

import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function fieldUpdate() {
		dispatch('update', {
			value: value
		});
	}

export let value = {};
let fieldid = "";
let values = {
    render:"default",
    ctype:"str",
    options:[],
    order:0
};

function saveField(){
    value[fieldid] = values;
    console.log(values);
    values = {
        render:"default",
        ctype:"str",
        options:[],
        order:Object.entries(value).length
    };
    fieldid = "";
    fieldUpdate();
    
}
function deleteField(key){
    //console.log(key);
    delete value[fieldid];
}
</script>

<h5 class="font-size-16 mb-1"> Campos de la tabla </h5>
<button type="button" class="btn btn-sm btn-outline-success waves-effect waves-light" data-toggle="modal" data-target="#exampleModalScrollable"><i class="bx bx-plus font-size-14 align-middle"></i></button>
<ul>
    {#each Object.entries(value) as [key, val] }
        <li>{val.order}: {val.label} - {val.ctype}/{val.render}<button type="button" on:click={()=>{deleteField(key)}}  class="btn btn-outline-danger waves-effect waves-light">x</button></li>
    {/each}
  
</ul>

<div class="modal fade" id="exampleModalScrollable" tabindex="-1" role="dialog" aria-labelledby="exampleModalScrollableTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title mt-0" id="exampleModalScrollableTitle">Agregar campo</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group row">
                    <label for="example-text-input" class="col-md-2 col-form-label">Id</label>
                    <div class="col-md-10">
                        <input class="form-control" type="text" bind:value={fieldid} id="initial">
                    </div>
                    </div>
                <div class="form-group row">
                    <label class="col-md-2 col-form-label">Tipo de campo</label>
                    <div class="col-md-10">
                          <FieldsType bind:value={values.ctype} />
                      </div>
                     </div>
                
                     <div class="form-group row">
                     <label class="col-md-2 col-form-label">Ver como</label>
                     <div class="col-10">
                        <FieldsRender bind:value={values.render} filter={values.ctype} />
                      </div>
                      </div>
                
                      <div class="form-group row">
                      <label for="example-text-input" class="col-md-2 col-form-label">Initial</label>
                     <div class="col-md-10">
                       {#if values.ctype == "list"}
                        
                        <InitialArray bind:value={values.initial} />
                      {:else if values.ctype =="dict"}
                        <InitialMap bind:value={values.initial} />
                       {:else}
                        <input class="form-control" type="text" bind:value={values.initial} id="initial" />
                       {/if}
                        
                     </div>
                     </div>
                
                     <div class="form-group row">
                    <label for="example-text-input" class="col-md-2 col-form-label">Label</label>
                    <div class="col-md-10">
                        <input class="form-control" type="text" bind:value={values.label} id="label">
                    </div>
                     </div>
                    
                     <div class="form-group row">
                    <label for="example-number-input" class="col-md-2 col-form-label">Order</label>
                    <div class="col-md-10">
                    <input class="form-control" type="number" bind:value={values.order} id="order">
                    </div>
                     </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" disabled={fieldid == ""} on:click={saveField}>Guardar</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>
<!-- /.modal -->