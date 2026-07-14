<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser} from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
	
  import {users} from "../controls/users.js"
import ChargerSearchList from "../controls/ChargerSearchList.svelte"
import Prescriptions_historyDosis_unitListSelect from "../controls/Prescriptions_historyDosis_unitListSelect.svelte"
import Prescriptions_historyFrequencyListSelect from "../controls/Prescriptions_historyFrequencyListSelect.svelte"
import Prescriptions_historyOperationListSelect from "../controls/Prescriptions_historyOperationListSelect.svelte"
import {patients} from "../controls/patients.js"
import PatientsSearchList from "../controls/PatientsSearchList.svelte"
import Prescriptions_historyViaListSelect from "../controls/Prescriptions_historyViaListSelect.svelte"

 function checkVisibles(){
	if((values.frequency == 0 || values.frequency == 1) != (old.frequency == 0 || old.frequency == 1)){ if(!(values.frequency == 0 || values.frequency == 1) &&  old.frecuency_amount != undefined){ values.frecuency_amount = firebase.firestore.FieldValue.delete(); } }; 
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
      db.collection("prescriptions_history")
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
        db.collection("prescriptions_history")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }else{
        values.edited = timenow;
        db.collection("prescriptions_history")
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
      db.collection("prescriptions_history")
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
  <TitleBar title="Agregar Historial" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="#select-charger" class="col-md-4 col-form-label">Modificado por</label>
	<div class="col-md-8"><ChargerSearchList bind:value={values.charger}  />
	</div> </div>

	<div class="form-group row"><label for="operation" class="col-md-4 col-form-label">Tipo</label> <div class="col-md-4"><Prescriptions_historyOperationListSelect bind:value={values.operation} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="#select-patients" class="col-md-4 col-form-label">Paciente</label>
	<div class="col-md-8"><PatientsSearchList bind:value={values.patients}  />
	</div> </div>

	<div class="form-group row"><label for="name" class="col-md-4 col-form-label">Medicamento</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.name} id="name"  required /> </div> </div>

	<div class="form-group row"><label for="ingredient" class="col-md-4 col-form-label">Substancia Activa</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.ingredient} id="ingredient"  /> </div> </div>

	<div class="form-group row"><label for="via" class="col-md-4 col-form-label">Via de administración</label> <div class="col-md-4"><Prescriptions_historyViaListSelect bind:value={values.via} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="amount" class="col-md-4 col-form-label">Cantidad a administrar</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.amount} id="amount"  /> </div> </div>

	<div class="form-group row"><label for="dosis_unit" class="col-md-4 col-form-label">Unidades</label> <div class="col-md-4"><Prescriptions_historyDosis_unitListSelect bind:value={values.dosis_unit} inlist={false}  /> </div> </div>

	<div class="custom-control custom-switch mb-2" dir="ltr">
	<input type="checkbox" class="custom-control-input" id="emptySwitch" bind:checked={values.empty}>
	<label class="custom-control-label" for="emptySwitch">En Ayuno</label>
	</div>
	<div class="form-group row"><label for="frequency" class="col-md-4 col-form-label">Administrar durante</label> <div class="col-md-4"><Prescriptions_historyFrequencyListSelect bind:value={values.frequency} inlist={false}  /> </div> </div>
{#if values.frequency == 0 || values.frequency == 1 } 
	<div class="form-group row"><label for="frecuency_amount" class="col-md-4 col-form-label">{#if values.frecuency == 0}Días{:else}Dosis{/if}</label><div class="col-md-8 input-group"><input class="form-control " type="number" bind:value={values.frecuency_amount} id="frecuency_amount"  /> </div> </div>
{/if}
	<div class="form-group row"><label for="observations" class="col-md-4 col-form-label">Observaciones</label><div class="col-md-8 input-group"><textarea class="form-control " type="text" bind:value={values.observations} id="observations"  ></textarea> </div> </div>

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