<script>
import TitleBar from "../TitleBar.svelte";
import {link} from 'svelte-spa-router';
import { pop } from "svelte-spa-router";
import { onMount } from "svelte";
import InitialArray from "../controls/InitialArray.svelte";
import InitialMap from "../controls/InitialMap.svelte";
import OptionsFieldModal from "../controls/OptionsFieldModal.svelte";
import FieldsType from "../controls/FieldsType.svelte";
import FieldsRender from "../controls/FieldsRender.svelte";
import { fun } from "../callable";

export let params = {};

  let values = {
    list: false,
    required: false,
    render:"default",
    ctype:"str",
    options:[],
    order:1
  };
  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;
  
  const tempId = params.fid;
  const node = params.node;
  
  let fieldid = params.fid;
  let ctype;
  let optionValue;
  let optionOff;
  let optionArray = "";

  
  
 
  
  //$: optionArray;
  $: values.ctype , addDefaults();

  function addDefaults(){
    if(values.ctype == "ref" && values.options.length == 0){
      values.options.push({"component":fieldid,"index":fieldid,"route":fieldid});
    }
    
  }

  if(filterName != undefined && filterValue != undefined){
        //console.log("filter : "+filterName+" == "+filterValue)
        values[filterName] = filterValue;
    }
  

  onMount(() => {
    form = document.getElementById('form');
    var defaultOptions = {};

    // touchspin
    jQuery('[data-toggle="touchspin"]').each(function (idx, obj) {
      var objOptions = jQuery.extend({}, defaultOptions, jQuery(obj).data());
      jQuery(obj)
        .TouchSpin(objOptions)
        .on("change", function () {
          //this.value
          // newResidents = this.value;
        });
    });
    jQuery(".input-mask").inputmask();
    if (tempId == null) {
      loading = false;
    } else {
      db.collection(node)
        .doc("data")
        .collection("schema")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
          } else {
            values = query.data();
            if(values.options == "base"){
              values.options = [{"base":true}];
              values = values;
            }
            console.log("got fiel data",tempId, values,query.data());
            
          }
          loading = false;
        });
    }
  });

  function cancel() {
    pop();
  }

  function updateData() {
     console.log(values);
      db.collection(node)
        .doc("data")
        .collection("schema")
        .doc(fieldid)
        .set(values);
      pop();
        
  }

  function addOption() {

    try{
      var opj = JSON.parse(optionArray);
      
      values.options.push(opj); 
      console.log("op json", opj, values.options);
      values = values;
      optionArray = "";
    }catch(err){
      alert("error "+err+"."+optionArray);
    }

  }

  

function deleteOption(oidx) {
  
  
  values.options.splice(oidx, 1);
  values = values;
  console.log("delete options", oidx,values.options);
}

</script>

<div class="page-content">
  <TitleBar title="Formulario alta" base="Dashboard" />
  
  
  <div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <form id="form">            
  

    

    

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
    
    

  <div class="form-group row">
    <label for="example-text-input" class="col-md-2" >Options</label>
  <div class="col-md-8">
    <input class="form-control" type="text" id="options" bind:value={optionArray}>
  </div>
  <div class="col-md-2">
    <button type="button" on:click={addOption} class="btn btn-primary waves-effect waves-light" > + </button>
  </div>

    
 
      {#if values.options != undefined && values.options.length != 0}
      <div class="col-12">
                  <div class="card">
                    <div class="card-body">
                  <h4 class="card-title mb-4">Options</h4>
                  <ul class="inbox-wid list-unstyled">
                  {#each values.options as option, oidx}
                  
                      <li class="inbox-list-item">
                          
                              <div class="media">
                                <div class="col-auto">
                                  <div class="media-body overflow-hidden">
                                      
                                    <button  type="button" on:click={()=>{deleteOption(oidx)}} class="btn btn-outline-danger waves-effect waves-light"><i class="bx bx-x font-size-14 align-middle"></i>
                                    </button>
                                  </div>
                                </div>
                                    

                                    
                                      <div class="col">
                                        
                                          {#if option.fields != undefined && Object.entries(option.fields).length >= 0}
                                            <OptionsFieldModal bind:value={option.fields} on:update={(event)=>{ values.options[oidx].fields = event.detail.value;  values =values; console.log(values, oidx, event);}} />
                                            {JSON.stringify(option)}
                                          {:else if option.route != undefined}
                                          <h5 class="font-size-16 mb-1">{oidx}:</h5><br />  
                                            Component <input bind:value={option.component} /><br />
                                            Index <input bind:value={option.index} /><br />
                                            Route <input bind:value={option.route} /><br />
                                            Filter (row) <input bind:value={option.filter} /> <small>ej: (row)=>{'{'} return row.statusId == 1 ;{'}'}</small><br />
                                            OnSelect (object) <input bind:value={option.select} /> <small>ej: (selected)=>{'{'} values.name = selected.name ;{'}'}</small><br />
                                            {JSON.stringify(option)}
                                          {:else}
                                          <h5 class="font-size-16 mb-1">{oidx}:  {JSON.stringify(option)}</h5>
                                          {/if}
                                        
                                    
                                  </div>
                                </div>
                           
                              
                          
                      </li>
                      
                      {/each}
                    </ul>
          </div>
        </div>
      </div>
      {/if}
        </div>
        
        <div class="col-md-10">
          <div class="form-check mb-2">
              <input class="form-check-input" type="checkbox" bind:checked={values.editable}  id="defaultCheck1">
              
              <label class="form-check-label" for="defaultCheck1">
                  Modificable en sitio
              </label>
          </div>
      </div>
      <div class="col-md-10">
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" bind:checked={values.list}  id="defaultCheck1">
            
            <label class="form-check-label" for="defaultCheck1">
                List
            </label>
        </div>
    </div>

    <div class="col-md-10">
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" bind:checked={values.required} id="defaultCheck1">
            
            <label class="form-check-label" for="defaultCheck1">
                                            Required
                                        </label>
                                        
        </div>
        
    </div>
    <div class="col-md-10">
      <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" bind:checked={values.only_flutter} id="defaultCheckF">
          
          <label class="form-check-label" for="defaultCheckF">
                                          Only Flutter
                                      </label>
                                      
      </div>
      
  </div>
  

</form>

    <button type="button"
            on:click={updateData}
            class="btn btn-primary waves-effect waves-light"
            disabled={loading}> {#if loading}<i class="bx bx-loader bx-spin font-size-16 align-middle mr-2"></i>{/if}
            Guardar</button>
          {#if loading}
            <div class="spinner-grow text-secondary m-1" role="status">
              <span class="sr-only">Guardando...</span>
            </div>
          {/if}
          <button type="button" 
            on:click={cancel}
            class="btn btn-light waves-effect waves-light"
            disabled={loading}>
            Cancelar</button>
   
</div>
</div>
</div>
</div>
</div> 
