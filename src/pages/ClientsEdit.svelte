<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import ClienttypeListSelect from "../controls/ClienttypeListSelect.svelte"


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
      db.collection("clients")
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
      db.collection("clients")
        .doc(tempId)
        .update(values)
        .then(function () {
          loading = false;
          pop();
        });
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("clients")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Cliente" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="clientType" class="col-md-4 col-form-label">Tipo</label> <div class="col-md-4"><ClienttypeListSelect bind:value={values.clientType} inlist={false} /> </div> </div>

	<div class="form-group row"><label for="displayName" class="col-md-4 col-form-label">Nombre del Cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.displayName} id="displayName"  /> </div> </div>

	<div class="form-group row"><label for="email" class="col-md-4 col-form-label">Email</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.email} id="email"  /> </div> </div>

	<div class="form-group row"><label for="token" class="col-md-4 col-form-label">Token</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.token} id="token"  /> </div> </div>

	<div class="form-group row"><label for="photoUri" class="col-md-4 col-form-label">Foto</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.photoUri} id="photoUri"  /> </div> </div>

	<div class="form-group row"><label for="phoneNumber" class="col-md-4 col-form-label">Teléfono</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.phoneNumber} id="phoneNumber"  /> </div> </div>

	<div class="form-group row"><label for="uid" class="col-md-4 col-form-label">Id de cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.uid} id="uid"  /> </div> </div>

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