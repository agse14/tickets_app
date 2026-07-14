<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import EquipmentsalesRental_typeListSelect from "../controls/EquipmentsalesRental_typeListSelect.svelte"
import {equipment} from "../controls/equipment.js"
import EquipmentSearchList from "../controls/EquipmentSearchList.svelte"
import {equipmentsalesmen} from "../controls/equipmentsalesmen.js"
import EquipmentsalesmenSearchList from "../controls/EquipmentsalesmenSearchList.svelte"
import EquipmentsalesClient_typeListSelect from "../controls/EquipmentsalesClient_typeListSelect.svelte"
import EquipmentsalesStatus from "../controls/EquipmentsalesStatus.svelte"
import {equipmentdriver} from "../controls/equipmentdriver.js"
import EquipmentdriverSearchList from "../controls/EquipmentdriverSearchList.svelte"
import ImageField from "../controls/ImageField.svelte";



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
      db.collection("equipmentsales")
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
        db.collection("equipmentsales")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            pop();
          });
      }else{
        values.edited = timenow;
        db.collection("equipmentsales")
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
      db.collection("equipmentsales")
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
  <TitleBar title="Agregar Venta/Renta" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">

	<div class="form-group row"><label for="rental_type" class="col-md-4 col-form-label">Tipo de transacción</label> <div class="col-md-4"><EquipmentsalesRental_typeListSelect bind:value={values.rental_type} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="#select-equipment" class="col-md-4 col-form-label">Equipo</label>
	<div class="col-md-8"><EquipmentSearchList bind:value={values.equipment}  onSelect={(data)=>{if(values.rental_type == 0){values.price = data.rent;}else{values.price = data.price;}}}  />
	</div> </div>

	<div class="form-group row"><label for="folio" class="col-md-4 col-form-label">Folio</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.folio} id="folio"  /> </div> </div>

	<div class="form-group row"><label for="status" class="col-md-4 col-form-label">Estatus de la Renta</label> <div class="col-md-4"><EquipmentsalesStatus bind:value={values.status} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="start" class="col-md-4 col-form-label">Fecha Inicio</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.start} id="start"  /> </div> </div>

	<div class="form-group row"><label for="end" class="col-md-4 col-form-label">Fecha Fin</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.end} id="end"  /> </div> </div>

	<div class="form-group row"><label for="delivery" class="col-md-4 col-form-label">Fecha Entrega</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.delivery} id="delivery"  /> </div> </div>

	<div class="form-group row"><label for="price" class="col-md-4 col-form-label">Precio</label><div class="col-md-4 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.price} id="price"  /> </div> </div>

	<div class="form-group row"><label for="comision" class="col-md-4 col-form-label">Comisión</label><div class="col-md-4 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.comision} id="comision"  /> </div> </div>

	<div class="form-group row"><label for="name" class="col-md-4 col-form-label">Nombre del cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.name} id="name"  /> </div> </div>

	<div class="form-group row"><label for="delivery_charge" class="col-md-4 col-form-label">Flete</label><div class="col-md-4 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.delivery_charge} id="delivery_charge"  /> </div> </div>

	<div class="form-group row"><label for="deposit" class="col-md-4 col-form-label">Deposito en garantía</label><div class="col-md-4 input-group"><div class="input-group-prepend"><span class="input-group-text">$</span></div><input class="form-control input-mask" type="number" bind:value={values.deposit} id="deposit"  /> </div> </div>

	<div class="form-group row"><label for="#select-equipmentsalesmen" class="col-md-4 col-form-label">Vendedor</label>
	<div class="col-md-8"><EquipmentsalesmenSearchList bind:value={values.equipmentsalesmen}  canAdd={true} />
	</div> </div>

	<div class="form-group row"><label for="client_type" class="col-md-4 col-form-label">Tipo de cliente</label> <div class="col-md-4"><EquipmentsalesClient_typeListSelect bind:value={values.client_type} inlist={false}  /> </div> </div>

	<div class="form-group row"><label for="patient" class="col-md-4 col-form-label">Nombre del paciente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.patient} id="patient"  /> </div> </div>

	<div class="form-group row"><label for="email" class="col-md-4 col-form-label">Email del cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.email} id="email"  /> </div> </div>

	<div class="form-group row"><label for="family_name" class="col-md-4 col-form-label">Familiar responsable</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.family_name} id="family_name"  /> </div> </div>

	<div class="form-group row"><label for="phone" class="col-md-4 col-form-label">Telefono del cliente</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.phone} id="phone"  /> </div> </div>

	<div class="form-group row"><label for="payment_address" class="col-md-4 col-form-label">Dirección de cobranza</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.payment_address} id="payment_address"  /> </div> </div>

	<div class="form-group row"><label for="address" class="col-md-4 col-form-label">Dirección del equipo</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.address} id="address"  /> </div> </div>

	<div class="form-group row"><label for="#select-equipmentdriver" class="col-md-4 col-form-label">Chofer</label>
	<div class="col-md-8"><EquipmentdriverSearchList bind:value={values.equipmentdriver}  canAdd={true} />
	</div> </div>

	<div class="form-group row"><label for="ine" class="col-12 col-form-label">Foto INE</label> 
	<div class="col-12">  <ImageField bind:value={values.ine} node={values.id} baseId={'ine'} type={'file'} /> </div>
	</div>

	<div class="form-group row"><label for="picture" class="col-12 col-form-label">Foto Casa</label> 
	<div class="col-12">  <ImageField bind:value={values.picture} node={values.id} baseId={'picture'} type={'file'} /> </div>
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