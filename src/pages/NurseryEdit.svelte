<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser} from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
	
  import {branches} from "../controls/branches.js"
import BranchSearchList from "../controls/BranchSearchList.svelte"
import VisualScale from "../controls/VisualScale.svelte"
import EvaOptions from "../controls/EvaOptions.svelte"
import FeedingOptions from "../controls/FeedingOptions.svelte"
import DayPeriodOptions from "../controls/DayPeriodOptions.svelte"
import {patients} from "../controls/patients.js"
import PatientnameSearchList from "../controls/PatientnameSearchList.svelte"

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
  if(params.wild != undefined && params.wild != ""){
    let parray = params.wild.split("/");
    for (let p = 0; p < parray.length; p++) {
      const element = parray[p];
      if(p%2 == 0 && parray[p+1] != undefined && parray[p+1] != ""){
        //console.log("p ", p, element);
        values[element]=parray[p+1];
      }
    }
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
      
			values.date = DateTime.local().toISODate();
    } else {
      db.collection("nursery")
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
        db.collection("nursery")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }else{
        values.edited = timenow;
        db.collection("nursery")
          .doc(tempId)
          .update(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }
      
    } else {
      //Crear nuevo si no tiene
      if(values.added == undefined){
        values.added = timenow;
      }
      values.createdBy = $fbuser.uid;
      values.createdName = $fbuser.displayName ?? '';
      db.collection("nursery")
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
  <TitleBar title="Agregar Reportes" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="date" class="col-md-4 col-form-label">Fecha</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.date} id="date"  required /> </div> </div>

	<div class="form-group row"><label for="#select-branch" class="col-md-4 col-form-label">Estancia</label>
	<div class="col-md-8"><BranchSearchList bind:value={values.branch}  />
	</div> </div>

	<div class="form-group row"><label for="#select-patientName" class="col-md-4 col-form-label">Nombre</label>
	<div class="col-md-8"><PatientnameSearchList bind:value={values.patientName}  filter={(row)=>{return (row.statusId == 0 || row.statusId == undefined) && row.branch == values.branch;}} onSelect={(patient)=>{values.service = 'Emme';values.afiliate = patient.emme;}} />
	</div> </div>

	<div class="form-group row"><label for="age" class="col-md-4 col-form-label">Edad</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.age} id="age"  /> </div> </div>

	<div class="form-group row"><label for="service" class="col-md-4 col-form-label">Servicio Emergencia</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.service} id="service"  required /> </div> </div>

	<div class="form-group row"><label for="afiliate" class="col-md-4 col-form-label">Afiliacion</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.afiliate} id="afiliate"  /> </div> </div>

	<div class="form-group row"><label for="diagnose" class="col-md-4 col-form-label">Diagnostico</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.diagnose} id="diagnose"  required /> </div> </div>

	<div class="form-group row"><label for="vitals" class="col-md-4 col-form-label">Temperatura (C)</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.temp} id="temp" min="34" max="42"  /> </div> </div>

	<div class="form-group row"><label for="dxs" class="col-md-4 col-form-label">Presión sanguinea Sistólica</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.blood} id="blood" min="20" max="200" /> </div> </div>
	<div class="form-group row"><label for="dxs" class="col-md-4 col-form-label">Presión sanguinea Diastólica</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.bloodd} id="bloodd" min="20" max="200" /> </div> </div>
  <div class="form-group row"><label for="vitals" class="col-md-4 col-form-label">Frecuencia Cardiaca</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.cardiac} id="cardiac" min="34" max="250"  /> </div> </div>
  <div class="form-group row"><label for="vitals" class="col-md-4 col-form-label">Frecuencia Respiratoria</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.respiratory} id="respiratory" min="15" max="50"  /> </div> </div>
	<div class="form-group row"><label for="dxs" class="col-md-4 col-form-label">Dxs</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.dxs} id="dxs"  /> </div> </div>

	<div class="form-group row"><div class="col-md-4 col-form-label">Alimentación</div> <div class="col-md-8"> <FeedingOptions bind:value={values.feeding_times} /> </div></div>
	<div class="form-group row"><label for="evacuation" class="col-md-4 col-form-label">Observaciones de Alimentación</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.evacuation} id="evacuation"  /> </div> </div>
  <div class="form-group row"><div class="col-md-4 col-form-label">Evacuación</div> <div class="col-md-8"> <DayPeriodOptions bind:value={values.evacuation_period} /> </div></div>
	<div class="form-group row"><label for="evacuation" class="col-md-4 col-form-label">Observaciones de Evacuacion</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.evacuation} id="evacuation"  /> </div> </div>
  <div class="form-group row"><div class="col-md-4 col-form-label">Micción</div> <div class="col-md-8"> <DayPeriodOptions bind:value={values.urination_period} /> </div></div>
	<div class="form-group row"><label for="urination" class="col-md-4 col-form-label">Observaciones de Micción</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.urination} id="urination"  /> </div> </div>

	<div class="form-group row"><label for="specialCare" class="col-md-4 col-form-label">Cuidados Especiales</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.specialCare} id="specialCare"  /> </div> </div>

	<div class="form-group row"><label for="functionality" class="col-md-4 col-form-label">Funcionalidad</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.functionality} id="functionality"  /> </div> </div>

	<div class="form-group row"><label for="weight" class="col-md-4 col-form-label">Peso</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.weight} id="weight"  /> </div> </div>

	<div class="form-group row"><label for="vs" class="col-md-4 col-form-label"> </label><div class="col-md-8"><VisualScale on:change={(event)=>{setField("eva",event.detail.value);}} bind:data={values} inlist={false} on:action={onAction}  /> </div> </div>

	<div class="form-group row"><label for="observations" class="col-md-4 col-form-label">Observaciones</label><div class="col-md-8 input-group"><textarea class="form-control" bind:value={values.observations} id="observations"  /> </div> </div>

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