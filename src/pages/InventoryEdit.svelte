<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import {branches} from "../controls/branches.js"
import BranchesSearchList from "../controls/BranchesSearchList.svelte"
import {products} from "../controls/products.js"
import ProductsSearchList from "../controls/ProductsSearchList.svelte"



  export let params = {};
  export let values = {};
  export let autoAdd = false;
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
      db.collection("inventory")
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
    loading = true;
    
    if (tempId != null) {
      //Actualizar si tiene id
      if(!exists){
        values.added = timenow;
        db.collection("inventory")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }else{
        values.edited = timenow;
        db.collection("inventory")
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
      db.collection("inventory")
        .add(values)
        .then(function () {
          loading = false;
          onBack();
        });
    }
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
</script>

<div class="page-content modal-body">
  <TitleBar title="Agregar Inventario Meta" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-md-12 col-xl-4">
	<div class="card">
	<div class="card-body">
	<div class="form-group row"><label for="#select-branches" class="col-md-4 col-form-label">Sucursal</label>
	<div class="col-md-8"><BranchesSearchList bind:value={values.branches}  inlist={true} fields={['avatar']} />
	</div> </div>
</div>
	</div>
	</div>

<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Datos de producto</h3>

	<div class="form-group row"><label for="#select-products" class="col-md-4 col-form-label">Producto</label>
	<div class="col-md-8"><ProductsSearchList bind:value={values.products}  />
	</div> </div>

	<div class="form-group row"><label for="quantity" class="col-md-4 col-form-label">Cantidad Meta</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.quantity} id="quantity"  step="0.01" /> </div> </div>
</div>
	</div>
	</div>

  </div>
</form>
  
</div>
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