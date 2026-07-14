<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import {partners} from "../controls/partners.js"
import PartnerSearchList from "../controls/PartnerSearchList.svelte"
import TypeListSelect from "../controls/TypeListSelect.svelte"
import SexListSelect from "../controls/SexListSelect.svelte"
import StatusListSelect from "../controls/StatusListSelect.svelte"


  export let params = {};

  let values = {};
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
      db.collection("services")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
          } else {
            values = query.data();
            
          }
          loading = false;
        });
    }
  });

  function cancel() {
    pop();
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
    loading = true;
    if (tempId != null) {
      //Actualizar si tiene id
      values.edited = timenow;
      db.collection("services")
        .doc(tempId)
        .update(values)
        .then(function () {
          loading = false;
          pop();
        });
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("services")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Servicio" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="folio" class="col-md-4 col-form-label">Servicio #</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.folio} id="folio"  /> </div> </div>

	<div class="form-group row"><label for="status" class="col-md-4 col-form-label">Estatus</label> <div class="col-md-4"><StatusListSelect bind:value={values.status} inlist={false} /> </div> </div>

	<div class="form-group row"><label for="userName" class="col-md-4 col-form-label">Cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.userName} id="userName"  /> </div> </div>

	<div class="form-group row"><label for="userEmail" class="col-md-4 col-form-label">Email</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.userEmail} id="userEmail"  /> </div> </div>

	<div class="form-group row"><label for="start" class="col-md-4 col-form-label">Fecha del servicio</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.start} id="start"  /> </div> </div>

	<div class="form-group row"><label for="#select-partner" class="col-md-4 col-form-label">Asignado a</label>
	<div class="col-md-8"><PartnerSearchList bind:value={values.partner}  />
	</div> </div>

	<div class="form-group row"><label for="partnerName" class="col-md-4 col-form-label">Enfermero asignado</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.partnerName} id="partnerName"  /> </div> </div>

	<div class="form-group row"><label for="charge" class="col-md-4 col-form-label">Cargo</label><div class="col-md-4 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.charge} id="charge"  /> </div> </div>

	<div class="form-group row"><label for="discount" class="col-md-4 col-form-label">discount</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.discount} id="discount"  /> </div> </div>

	<div class="custom-control custom-switch mb-2" dir="ltr">
	<input type="checkbox" class="custom-control-input" id="extraSwitch" bind:checked={values.extra}>
	<label class="custom-control-label" for="extraSwitch">Con cargo extra</label>
	</div>
	<div class="form-group row"><label for="extraCharge" class="col-md-4 col-form-label">Cantidad Extra</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.extraCharge} id="extraCharge"  /> </div> </div>

	<div class="form-group row"><label for="type" class="col-md-4 col-form-label">Tipo</label> <div class="col-md-4"><TypeListSelect bind:value={values.type} inlist={false} /> </div> </div>

	<div class="form-group row"><label for="sex" class="col-md-4 col-form-label">Sexo</label> <div class="col-md-4"><SexListSelect bind:value={values.sex} inlist={false} /> </div> </div>

	<div class="form-group row"><label for="speciality" class="col-md-4 col-form-label">speciality</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.speciality} id="speciality"  /> </div> </div>

	<div class="custom-control custom-switch mb-2" dir="ltr">
	<input type="checkbox" class="custom-control-input" id="repeatSwitch" bind:checked={values.repeat}>
	<label class="custom-control-label" for="repeatSwitch">Servicio Repetido</label>
	</div>
	<div class="form-group row"><label for="hours" class="col-md-4 col-form-label">Horas</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.hours} id="hours"  /> </div> </div>

	<div class="form-group row"><label for="date" class="col-md-4 col-form-label">date</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.date} id="date"  /> </div> </div>

	<div class="form-group row"><label for="uid" class="col-md-4 col-form-label">Id cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.uid} id="uid"  /> </div> </div>

	<div class="form-group row"><label for="eval" class="col-md-4 col-form-label">Evaluación</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.eval} id="eval"  /> </div> </div>

</div>
	</div>
</div>
  </div>
</form>
  <div class="row">
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
</div>