<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import {patients} from "../controls/patients.js"
import PatientsSearchList from "../controls/PatientsSearchList.svelte"



  export let params = {};
  export let values = {};
  export let autoAdd = false;
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
      db.collection("guest_card")
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
        db.collection("guest_card")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            pop();
          });
      }else{
        values.edited = timenow;
        db.collection("guest_card")
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
      db.collection("guest_card")
        .add(values)
        .then(function () {
          loading = false;
          pop();
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

<div class="page-content">
  <TitleBar title="Agregar Carta huesped" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">
</div>
	</div>
	</div>
</div>

<div class="row">
	
<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Carta huésped </h3>

	<div class="form-group row"><label for="#select-patients" class="col-md-4 col-form-label">Nombre:</label>
	<div class="col-md-8"><PatientsSearchList bind:value={values.patients}  />
	</div> </div>

	<h3>Horario de actividades</h3>

	
				
	<div class="form-group row"><label for="schedule" class="col-12 col-form-label">Tarjeta de actividades</label> 
	
				
				<div className="col-12">
				<div class="table-responsive">
                                        <table class="table table-sm mb-0">

                                            <thead class="thead-light">
                                                <tr>
													<th>#</th>
                                                    <th>Horario</th>
					<th>Actividades Especiales:</th>
					<th>Actividades Especiales:</th>
					
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
											{#if values.schedule != undefined}
                                            <tbody>
											
											{#each values.schedule as subfield, sfk}
                                                <tr>
                                                    <th scope="row">{sfk+1}</th>
                                                   <td>{subfield.hours}</td><td>{subfield.special_activities}</td><td>{subfield.specialLactivities2}</td>
                                                    <td>
													<button type="button" class="btn btn-outline-error" on:click={()=>{deleteFromTable('schedule', sfk);}}>x<i className="zmdi zmdi-plus"></i></button>

													 </td>
                                                </tr>
												{/each}
                                            </tbody>
											{/if}
											<tr id="addschedule">
											<td>+</td>
											<td>
	<input class="form-control " type="text" bind:value={adder.hours} id="hours" placeholder="Horario"  />
</td><td>
	<input class="form-control " type="text" bind:value={adder.special_activities} id="special_activities" placeholder="Actividades Especiales:"  />
</td><td>
	<input class="form-control " type="text" bind:value={adder.specialLactivities2} id="specialLactivities2" placeholder="Actividades Especiales:"  />
</td>
												<td>
													<div class="font-icon-wrapper">
													<button type="button" class="btn btn-outline-success" on:click={()=>{addToTable('schedule', {hours: adder.hours,special_activities: adder.special_activities,specialLactivities2: adder.specialLactivities2});}}>+<i className="zmdi zmdi-plus"></i></button></div>
												</td>
											</tr>
                                        </table>
                                    </div>
						</div>
					</div>

	<h3>Imprimir información:</h3>

	 <button className="ml-3" color="primary" on:click={()=>{window.print()}} disabled={loading}>Imprimir</button>

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