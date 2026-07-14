<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import {branches} from "../controls/branches.js"
import BranchesSearchList from "../controls/BranchesSearchList.svelte"
import ProductsSearchList from "../controls/ProductsSearchList.svelte"


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
      db.collection("pastinventory")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
          } else {
            values = query.data();
            /*for (const property in values) {
              if(values[property] >= 0){

              }
              console.log(`${property}: ${values[property]}`);
            }*/
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
      db.collection("pastinventory")
        .doc(tempId)
        .update(values)
        .then(function () {
          loading = false;
          pop();
        });
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("pastinventory")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Historial Inventario" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="#select-branches" class="col-md-4 col-form-label">Sucursal</label>
	<div class="col-md-8"><BranchesSearchList bind:value={values.branches} inlist={true} />
	</div> </div>

	<div class="form-group row"><label for="dayId" class="col-md-4 col-form-label">Fecha de registro</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.dayId} id="dayId" disabled /> </div> </div>
  <div class="form-group row"><label class="col-md-12 col-form-label">Inventario registrado</label>
     </div>
    <div class="form-group row">
      <table class="table table-sm m-0">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cantidad</th>
            </tr>
        </thead>
        <tbody>
            
            
        
        {#each Object.entries(values) as [cat_key, cat_val] (cat_key) }
          {#if cat_val >=0}
          <tr>
            <th scope="row"><ProductsSearchList value={cat_key} inlist={true} /></th>
            <td>{cat_val} <ProductsSearchList value={cat_key} inlist={true} fields={['unit']} onlyfields={true} /></td>
        </tr>
          {/if}
          
        {/each}
  </tbody>
</table>
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
            on:click={cancel}
            class="btn btn-light waves-effect waves-light"
            disabled={loading}>
            Regresar</button>
          
        </div>
      </div>
    </div>
    <!-- end col -->
  </div>
  <!-- end row -->
</div>