<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser} from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
	
  import {activities} from "../controls/activities.js"
import ActivitySearchList from "../controls/ActivitySearchList.svelte"
import {patients} from "../controls/patients.js"
import PatientSearchList from "../controls/PatientSearchList.svelte"

 function checkVisibles(){
}


  export let params = {};
  export let values = {};
  export let autoAdd = false;
  export let buttons = true;
  export let onBack = ()=> {
    pop();
  }
  
  let old = {};
  let adder = {};
  let exists = false;

  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;
  
  const tempId = params.bid;
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
          newResidents = this.value;
        });
    });
    jQuery(".input-mask").inputmask();
    if (tempId == null) {
      loading = false;
      
    } else {
      db.collection("cardActivities")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
          } else {
            exists = true;
            values = query.data();
            old = query.data();
            
          }
          loading = false;
        });
    }
  });

  function cancel() {
    onBack();
  }

  function updateData() {
    
    
    if(!form.checkValidity()){
      form.reportValidity();
      /*
        jQuery(".tab-pane").length
        for(var elem of form.elements){
          if(!elem.checkValidity()){ 
            $('.nav-tabs a[href="#personal-tab"]').tab('show');
            form.reportValidity();
            console.log(elem);
          }
        };
      */
      return;
    }
    if(checkVisibles != undefined){
      checkVisibles();
    }
    loading = true;
    
    if (tempId != null) {
      //Actualizar si tiene id
      if(!exists){
        values.added = timenow;
        db.collection("cardActivities")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }else{
        values.edited = timenow;
        db.collection("cardActivities")
          .doc(tempId)
          .update(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }
      
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      values.createdBy = $fbuser.uid;
      values.createdName = $fbuser.displayName ?? '';
      db.collection("cardActivities")
        .add(values)
        .then(function () {
          loading = false;
          onBack();
        });
    }
  }
  function setField(field, value){
    values[field] = value;
    values = values;
  }

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

  function onAction(event){
    const action = event.detail;
    if(action == "save"){
      //console.log("saved");
      updateData();
    }
  }
</script>

<div class="page-content modal-body">
  <TitleBar title="Agregar Tarjetas de Actividades" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="dayId" class="col-md-4 col-form-label">Fecha</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.dayId} id="dayId"  required /> </div> </div>

	<div class="form-group row"><label for="#select-patient" class="col-md-4 col-form-label">Huesped</label>
	<div class="col-md-8"><PatientSearchList bind:value={values.patient}  />
	</div> </div>

	<div class="form-group row"><label for="time" class="col-md-4 col-form-label">Hora</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.time} id="time"  required /> </div> </div>

	<div class="form-group row"><label for="#select-activity" class="col-md-4 col-form-label">Actividad</label>
	<div class="col-md-8"><ActivitySearchList bind:value={values.activity}  onSelect={(patient)=>{values.name = patient.name}} />
	</div> </div>

	<div class="form-group row"><label for="name" class="col-md-4 col-form-label">Nombre</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.name} id="name"  required /> </div> </div>

	<div class="custom-control custom-switch mb-2" dir="ltr">
	<input type="checkbox" class="custom-control-input" id="checkActivitySwitch" bind:checked={values.checkActivity}>
	<label class="custom-control-label" for="checkActivitySwitch">Completada</label>
	</div>
</div>
	</div>
</div>
  </div>
</form>
  
</div>
{#if buttons}
<div class="row modal-footer">
  <div class="col-12">
    <div class="card">
      <div class="card-body">
        
        <button
          on:click={updateData}
          class="btn btn-primary waves-effect waves-light"
          disabled={loading}> {#if loading}<i class="bx bx-loader bx-spin font-size-16 align-middle mr-2"></i>{/if}
          Guardar</button>
        {#if loading}
          <div class="spinner-grow text-secondary m-1" role="status">
            <span class="sr-only">Guardando...</span>
          </div>
        {/if}
        <button
          on:click={cancel}
          class="btn btn-light waves-effect waves-light"
          disabled={loading}>
          Cancelar</button>
        
      </div>
    </div>
  </div>
  <!-- end col -->
</div>
<!-- end row -->
{/if}