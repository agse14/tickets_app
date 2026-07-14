<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser} from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
	
  import BranchesSearchList from "../controls/BranchesSearchList.svelte"

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
      db.collection("positions")
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
        db.collection("positions")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }else{
        values.edited = timenow;
        db.collection("positions")
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
      db.collection("positions")
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
  <TitleBar title="Agregar Puesto" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="name" class="col-md-4 col-form-label">Puesto</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.name} id="name"  /> </div> </div>

	<div class="form-group row"><label for="base_pay" class="col-md-4 col-form-label">Sueldo base</label><div class="col-md-8 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.base_pay} id="base_pay"  /> </div> </div>

	
				
	<div class="form-group row"><label for="options" class="col-12 col-form-label">Sueldo Especial</label> 
	
				</div>
				<div class="form-group row">
				<div class="col-12">
				<div class="table-responsive">
                                        <table class="table table-sm mb-0">

                                            <thead class="thead-light">
                                                <tr>
													<th>#</th>
                                                    <th>Estancia</th>
					<th>Pago</th>
					
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
											{#if values.options != undefined}
                                            <tbody>
											
											{#each values.options as subfield, sfk}
                                                <tr>
                                                    <th scope="row">{sfk+1}</th>
                                                   <td><BranchesSearchList value={subfield.branches} inlist={true} /></td>
<td>{subfield.pay}</td>
                                                    <td>
													<button type="button" class="btn btn-outline-error" on:click={()=>{deleteFromTable('options', sfk);}}><i class="fas fa-times"></i></button>

													 </td>
                                                </tr>
												{/each}
                                            </tbody>
											{/if}
											<tr id="addoptions">
											<td>+</td>
											<td><BranchesSearchList bind:value={adder.branches}  /></td><td><div class="input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={adder.pay} id="pay"  /></div></td>
												<td>
													<div class="font-icon-wrapper">
													<button type="button" class="btn btn-outline" on:click={()=>{addToTable('options', {branches: adder.branches,pay: adder.pay});}}><i class="fas fa-plus"></i></button></div>
												</td>
											</tr>
                                        </table>
                                    </div>
						</div>
					</div>

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