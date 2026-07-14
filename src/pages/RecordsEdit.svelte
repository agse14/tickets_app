<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import RecordsTypeListSelect from "../controls/RecordsTypeListSelect.svelte"
import Activities_basicOptions from "../controls/Activities_basicOptions.svelte"
import Activities_generalOptions from "../controls/Activities_generalOptions.svelte"
import Activities_auxOptions from "../controls/Activities_auxOptions.svelte"
import ImageField from "../controls/ImageField.svelte";
import Activities_advancedOptions from "../controls/Activities_advancedOptions.svelte"
import Docs_containsOptions from "../controls/Docs_containsOptions.svelte"
import {partners} from "../controls/partners.js"
import PartnerSearchList from "../controls/PartnerSearchList.svelte"

$: if(!(values.type == 0)){ if(old.activities_basic !== undefined){ values.activities_basic = firebase.firestore.FieldValue.delete();} console.log('values.type == 0');}else{ if(old.activities_basic !== undefined){values.activities_basic = old.activities_basic;}  }; $: if(!(values.type == 2)){ if(old.activities_aux !== undefined){ values.activities_aux = firebase.firestore.FieldValue.delete();} console.log('values.type == 2');}else{ if(old.activities_aux !== undefined){values.activities_aux = old.activities_aux;}  }; $: if(!(values.type == 1)){ if(old.activities_advanced !== undefined){ values.activities_advanced = firebase.firestore.FieldValue.delete();} console.log('values.type == 1');}else{ if(old.activities_advanced !== undefined){values.activities_advanced = old.activities_advanced;}  }; 

  export let params = {};
  export let values = {};
  export let autoAdd = false;
  let old = {};
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
      db.collection("records")
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
      if(!exists){
        values.added = timenow;
        db.collection("records")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            pop();
          });
      }else{
        values.edited = timenow;
        db.collection("records")
          .doc(tempId)
          .update(values)
          .then(function () {
            loading = false;
            pop();
          });
      }
      
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("records")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Expediente" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-md-12 col-xl-4">
	<div class="card">
	<div class="card-body">
	<div class="form-group row"><label for="type" class="col-md-4 col-form-label">Tipo</label> <div class="col-md-4"><RecordsTypeListSelect bind:value={values.type} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="#select-partner" class="col-md-4 col-form-label">Persona</label>
	<div class="col-md-8"><PartnerSearchList bind:value={values.partner}  inlist={true} />
	</div> </div>

	<div class="form-group row"><label for="rfc" class="col-md-4 col-form-label">RFC</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.rfc} id="rfc"  /> </div> </div>

	<div class="form-group row"><label for="curp" class="col-md-4 col-form-label">CURP</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.curp} id="curp"  /> </div> </div>
</div>
	</div>
	</div>

<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Expediente de empleado</h3>

	<div class="form-group row"><label for="job_name" class="col-md-4 col-form-label">Empresa - Trabajo anterior</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.job_name} id="job_name"  /> </div> </div>

	<div class="form-group row"><label for="job_phone" class="col-md-4 col-form-label">Teléfono jefe directo</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.job_phone} id="job_phone"  /> </div> </div>

	<div class="form-group row"><label for="job_boss" class="col-md-4 col-form-label">Nombre jefe directo</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.job_boss} id="job_boss"  /> </div> </div>

	<div class="form-group row"><label for="job_start" class="col-md-4 col-form-label">Incio trabajo</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.job_start} id="job_start"  /> </div> </div>

	<div class="form-group row"><label for="job_description" class="col-md-4 col-form-label">Observaciones</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.job_description} id="job_description"  /> </div> </div>

	<div class="form-group row"><label for="job_end" class="col-md-4 col-form-label">Terminó trabajo</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.job_end} id="job_end"  /> </div> </div>
</div>
	</div>
	</div>
</div>

<div class="row">
	
<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Experciencia</h3>
{#if values.type == 2 } 
	<div class="form-group row"><div class="col-md-4 col-form-label">Actividades Cuidador</div> <div class="col-md-8"> <Activities_auxOptions bind:value={values.activities_aux} /> </div></div>{/if}{#if values.type == 0 } 
	<div class="form-group row"><div class="col-md-4 col-form-label">Actividades Enfermero Básico</div> <div class="col-md-8"> <Activities_basicOptions bind:value={values.activities_basic} /> </div></div>{/if}{#if values.type == 1 } 
	<div class="form-group row"><div class="col-md-4 col-form-label">Actividades Enfermero Avanzado</div> <div class="col-md-8"> <Activities_advancedOptions bind:value={values.activities_advanced} /> </div></div>{/if}
	<div class="form-group row"><div class="col-md-4 col-form-label">Enfermedades con experiencia</div> <div class="col-md-8"> <Activities_generalOptions bind:value={values.activities_general} /> </div></div></div>
	</div>
	</div>
</div>

<div class="row">
	
<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Archivos</h3>

	<div class="form-group row"><div class="col-md-4 col-form-label">Contenido de archivo</div> <div class="col-md-8"> <Docs_containsOptions bind:value={values.docs_contains} /> </div></div>
	<div class="form-group row"><label for="docs_files" class="col-12 col-form-label">Archivos Cargados</label> 
	<div class="col-12">  <ImageField bind:value={values.docs_files} node={values.id}  /> </div>
	</div>
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