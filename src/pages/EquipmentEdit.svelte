<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import EquipmentStatusListSelect from "../controls/EquipmentStatusListSelect.svelte"
import EquipmentCapacityListSelect from "../controls/EquipmentCapacityListSelect.svelte"

$: if(!(values.status == 2)){ if(old.maintenance !== undefined){ values.maintenance = firebase.firestore.FieldValue.delete();} console.log('values.status == 2');}else{ if(old.maintenance !== undefined){values.maintenance = old.maintenance;}  }; 

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
      db.collection("equipment")
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
        db.collection("equipment")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            pop();
          });
      }else{
        values.edited = timenow;
        db.collection("equipment")
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
      db.collection("equipment")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Concetrador" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="status" class="col-md-4 col-form-label">Estatus del Equipo</label> <div class="col-md-4"><EquipmentStatusListSelect bind:value={values.status} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="name" class="col-md-4 col-form-label">Número de serie</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.name} id="name"  /> </div> </div>

	<div class="form-group row"><label for="capacity" class="col-md-4 col-form-label">Capacidad</label> <div class="col-md-4"><EquipmentCapacityListSelect bind:value={values.capacity} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="kit" class="col-md-4 col-form-label"># Kit</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.kit} id="kit"  /> </div> </div>
{#if values.status == 2 } 
	<div class="form-group row"><label for="maintenance" class="col-md-4 col-form-label">Inicio Mantenimiento</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.maintenance} id="maintenance"  /> </div> </div>
{/if}
	<div class="form-group row"><label for="rent" class="col-md-4 col-form-label">Precio de renta</label><div class="col-md-4 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.rent} id="rent"  /> </div> </div>

	<div class="form-group row"><label for="price" class="col-md-4 col-form-label">Precio de venta</label><div class="col-md-4 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.price} id="price"  /> </div> </div>

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