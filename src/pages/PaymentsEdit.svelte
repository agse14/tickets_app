<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import ImageField from "../controls/ImageField.svelte";


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
      db.collection("payments")
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
      db.collection("payments")
        .doc(tempId)
        .update(values)
        .then(function () {
          loading = false;
          pop();
        });
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("payments")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Pago de servicio" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="folio" class="col-md-4 col-form-label">Servicio</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.folio} id="folio"  /> </div> </div>

	<div class="form-group row"><label for="userName" class="col-md-4 col-form-label">Cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.userName} id="userName"  /> </div> </div>

	<div class="form-group row"><label for="userEmail" class="col-md-4 col-form-label">Email</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.userEmail} id="userEmail"  /> </div> </div>

	<div class="form-group row"><label for="id" class="col-md-4 col-form-label">Transacción</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.id} id="id"  /> </div> </div>

	<div class="form-group row"><label for="amount" class="col-md-4 col-form-label">Pagado</label><div class="col-md-8"><input class="form-control input-mask" type="number" bind:value={values.amount} id="amount"  data-inputmask="'alias': 'numeric', 'groupSeparator': ',', 'digits': 2, 'digitsOptional': false, 'prefix': '$ ', 'placeholder': '0'" /> </div> </div>

	<div class="form-group row"><label for="createdAt" class="col-md-4 col-form-label">2020-10-01T18:33:38Z</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.createdAt} id="createdAt"  /> </div> </div>

	<div class="form-group row"><label for="merchantAccountId" class="col-md-4 col-form-label">Cuenta</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.merchantAccountId} id="merchantAccountId"  /> </div> </div>

	<div class="form-group row"><label for="productId" class="col-md-4 col-form-label">Producto</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.productId} id="productId"  /> </div> </div>

	<div class="form-group row"><label for="processorResponseCode" class="col-md-4 col-form-label">Código de respuesta</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.processorResponseCode} id="processorResponseCode"  /> </div> </div>

	<div class="form-group row"><label for="cardType" class="col-md-4 col-form-label">Tipo de tarjeta</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.cardType} id="cardType"  /> </div> </div>

	<div class="form-group row"><label for="imageUrl" class="col-12 col-form-label">Logo</label> 
	<div class="col-12">  <ImageField bind:value={values.imageUrl} node={values.id}  /> </div>
	</div>

	<div class="form-group row"><label for="processorResponseText" class="col-md-4 col-form-label">Respuesta</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.processorResponseText} id="processorResponseText"  /> </div> </div>

	<div class="form-group row"><label for="last4" class="col-md-4 col-form-label">Ultimos 4 digitos de la tarjeta</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.last4} id="last4"  /> </div> </div>

	<div class="form-group row"><label for="paymentInstrumentType" class="col-md-4 col-form-label">Método de pago</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.paymentInstrumentType} id="paymentInstrumentType"  /> </div> </div>

	<div class="form-group row"><label for="uid" class="col-md-4 col-form-label">Id del cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.uid} id="uid"  /> </div> </div>

	<div class="form-group row"><label for="currencyIsoCode" class="col-md-4 col-form-label">Moneda</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.currencyIsoCode} id="currencyIsoCode"  /> </div> </div>

	<div class="form-group row"><label for="processorAuthorizationCode" class="col-md-4 col-form-label">Autorización</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.processorAuthorizationCode} id="processorAuthorizationCode"  /> </div> </div>

	<div class="form-group row"><label for="sid" class="col-md-4 col-form-label">Id Servicio</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.sid} id="sid"  /> </div> </div>

	<div class="form-group row"><label for="start" class="col-md-4 col-form-label">start</label> <div class="col-md-8"> <input class="form-control" type="date" value="2019-08-19" id="start"> </div> </div>

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