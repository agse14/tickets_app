<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser} from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
	
  import {workers} from "../controls/workers.js"
import WorkersSearchList from "../controls/WorkersSearchList.svelte"

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
      db.collection("vacations")
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
        db.collection("vacations")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }else{
        values.edited = timenow;
        db.collection("vacations")
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
      db.collection("vacations")
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
  <TitleBar title="Agregar Dias de vacación" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="workerNumber" class="col-md-4 col-form-label"># de empleado</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.workerNumber} id="workerNumber"  required /> </div> </div>

	<div class="form-group row"><label for="department" class="col-md-4 col-form-label">Área y/o Departamento</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.department} id="department"  required /> </div> </div>

	<div class="form-group row"><label for="admissionDate" class="col-md-4 col-form-label">Fecha de ingreso</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.admissionDate} id="admissionDate"  required /> </div> </div>

	<div class="form-group row"><label for="#select-workers" class="col-md-4 col-form-label">Nombre Empleado</label>
	<div class="col-md-8"><WorkersSearchList bind:value={values.workers}  onSelect={(worker)=>{values.workerNumber = worker.folio;}}/>
	</div> </div>

	<div class="form-group row"><label for="serviceYears" class="col-md-4 col-form-label">Años de servicio</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.serviceYears} id="serviceYears"  /> </div> </div>

	<div class="form-group row"><label for="assignedDays" class="col-md-4 col-form-label">Días que corresponden</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.assignedDays} id="assignedDays"  /> </div> </div>

	<div class="form-group row"><label for="takenDays" class="col-md-4 col-form-label">Días a disfrutar</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.takenDays} id="takenDays"  /> </div> </div>

	<div class="form-group row"><label for="pendingDays" class="col-md-4 col-form-label">Días pendientes</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.pendingDays} id="pendingDays"  /> </div> </div>

	<div class="form-group row"><label for="periodStart" class="col-md-4 col-form-label">De:</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.periodStart} id="periodStart"  required /> </div> </div>

	<div class="form-group row"><label for="periodEnd" class="col-md-4 col-form-label">al Año</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.periodEnd} id="periodEnd"  required /> </div> </div>

	<div class="form-group row"><label for="start" class="col-md-4 col-form-label">Fecha de inicio</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.start} id="start"  /> </div> </div>

	<div class="form-group row"><label for="end" class="col-md-4 col-form-label">Fecha de regreso</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.end} id="end"  /> </div> </div>

	<div class="form-group row"><label for="returnDate" class="col-md-4 col-form-label">Fecha en que debe presentarse a trabajar</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.returnDate} id="returnDate"  required /> </div> </div>

	<div class="form-group row"><label for="notes" class="col-md-4 col-form-label">Observaciones</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.notes} id="notes"  /> </div> </div>

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