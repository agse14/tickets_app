<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import {patients} from "../controls/patients.js"
import PatientsSearchList from "../controls/PatientsSearchList.svelte"
import Clinic_historyStatusListSelect from "../controls/Clinic_historyStatusListSelect.svelte"



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
      db.collection("clinic_history")
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
        db.collection("clinic_history")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            pop();
          });
      }else{
        values.edited = timenow;
        db.collection("clinic_history")
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
      db.collection("clinic_history")
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
  <TitleBar title="Agregar Historial" base="Inventario" />
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
	<h3>Historia Clínica </h3>

	<div class="form-group row"><label for="date" class="col-md-4 col-form-label">Fecha: </label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.date} id="date"  required /> </div> </div>
</div>
	</div>
	</div>
</div>

<div class="row">
	
<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Datos personales:</h3>

	<div class="form-group row"><label for="#select-patients" class="col-md-4 col-form-label">Nombre:</label>
	<div class="col-md-8"><PatientsSearchList bind:value={values.patients}  />
	</div> </div>

	<div class="form-group row"><label for="birthdate" class="col-md-4 col-form-label">Fecha de Naciemiento:</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.birthdate} id="birthdate"  required /> </div> </div>

	<div class="form-group row"><label for="age" class="col-md-4 col-form-label">Edad:</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.age} id="age"  /> </div> </div>

	<div class="form-group row"><label for="status" class="col-md-4 col-form-label">Estado Civil: </label> <div class="col-md-4"><Clinic_historyStatusListSelect bind:value={values.status} inlist={false}  required /> </div> </div>
</div>
	</div>
	</div>
</div>

<div class="row">
	
<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Información clínica </h3>

	<div class="form-group row"><label for="background_family" class="col-md-4 col-form-label">Antecedentes Heredofamiliares:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.background_family} id="background_family"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="background_not_patological" class="col-md-4 col-form-label">Antecedentes personales no patológicos: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.background_not_patological} id="background_not_patological"  ></textarea> </div> </div>

	<div class="form-group row"><label for="background_patologic" class="col-md-4 col-form-label">Antecedentes personales patológicos:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.background_patologic} id="background_patologic"  ></textarea> </div> </div>

	<div class="form-group row"><label for="background_ginec_obs" class="col-md-4 col-form-label">Antecedentes Ginec-Obstétricos:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.background_ginec_obs} id="background_ginec_obs"  ></textarea> </div> </div>

	<div class="form-group row"><label for="prev_treat" class="col-md-4 col-form-label">Tratamiento Previo:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.prev_treat} id="prev_treat"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="laboratory" class="col-md-4 col-form-label">Laboratorio y Gabinete:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.laboratory} id="laboratory"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="peea" class="col-md-4 col-form-label">PEEA (en este apartado se integrará lo relacionado con el padecimiento actual que hace que el paciente acuda a nuestro hospital, es de mencionar que de cada uno de los síntomas se solicitará un desglose adecuado en base a calidad, cantidad, cronología, área, agravantes, atenuantes y acompañantes.) </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.peea} id="peea"  required ></textarea> </div> </div>
</div>
	</div>
	</div>
</div>

<div class="row">
	
<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Exploración física:</h3>

	<h3>Signos vitales:</h3>

	<div class="form-group row"><label for="fc" class="col-md-4 col-form-label">FC:</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.fc} id="fc"  required /> </div> </div>

	<div class="form-group row"><label for="fr" class="col-md-4 col-form-label">FR:</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.fr} id="fr"  required /> </div> </div>

	<div class="form-group row"><label for="ta" class="col-md-4 col-form-label">TA:</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.ta} id="ta"  required /> </div> </div>

	<div class="form-group row"><label for="temp" class="col-md-4 col-form-label">TEMP:</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.temp} id="temp"  required /> </div> </div>

	<div class="form-group row"><label for="general_inspection" class="col-md-4 col-form-label">Inspección general: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.general_inspection} id="general_inspection"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="head_neck" class="col-md-4 col-form-label">Cabeza y cuello:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.head_neck} id="head_neck"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="neurologic" class="col-md-4 col-form-label">Neurológico:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.neurologic} id="neurologic"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="skin_muc" class="col-md-4 col-form-label">Piel y mucosas:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.skin_muc} id="skin_muc"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="nutritional" class="col-md-4 col-form-label">Estado nutricional: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.nutritional} id="nutritional"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="respiratory" class="col-md-4 col-form-label">Respiratorio: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.respiratory} id="respiratory"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="cardio" class="col-md-4 col-form-label">Cardiovascular: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.cardio} id="cardio"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="abdominal" class="col-md-4 col-form-label">Abdomen: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.abdominal} id="abdominal"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="urinary" class="col-md-4 col-form-label">Genitourinario:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.urinary} id="urinary"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="osteoartic" class="col-md-4 col-form-label">Osteoarticular:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.osteoartic} id="osteoartic"  required ></textarea> </div> </div>

	<h3>**Valoración física y funcional:  </h3>

	<div class="form-group row"><label for="katz" class="col-md-4 col-form-label">Índice de KATZ: </label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.katz} id="katz"  required /> </div> </div>

	<div class="form-group row"><label for="katz_commentary" class="col-md-4 col-form-label">Comentarios:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.katz_commentary} id="katz_commentary"  required ></textarea> </div> </div>

	<h3>**Valoración mental y psicológica:</h3>

	<div class="form-group row"><label for="mmse" class="col-md-4 col-form-label">MMSE: </label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.mmse} id="mmse"  required /> </div> </div>

	<div class="form-group row"><label for="mmse_commentary" class="col-md-4 col-form-label">Comentarios: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.mmse_commentary} id="mmse_commentary"  required ></textarea> </div> </div>

	<h3>**Escala de depresión geriátrico:</h3>

	<div class="form-group row"><label for="dep_commentary" class="col-md-4 col-form-label">Comentarios: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.dep_commentary} id="dep_commentary"  required ></textarea> </div> </div>

	<h3>**Otros:</h3>

	<div class="form-group row"><label for="other_commentary" class="col-md-4 col-form-label">Comentarios: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.other_commentary} id="other_commentary"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="impdx" class="col-md-4 col-form-label">IMP.DX:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.impdx} id="impdx"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="treatment" class="col-md-4 col-form-label">Tratamiento no farmacológico y farmacológico: </label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.treatment} id="treatment"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="family_suggestion" class="col-md-4 col-form-label">Sugerencia a familiares:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.family_suggestion} id="family_suggestion"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="urgency" class="col-md-4 col-form-label">En caso de urgencias avisar a:</label><div class="col-md-8"><textarea class="form-control " type="text" bind:value={values.urgency} id="urgency"  required ></textarea> </div> </div>

	<div class="form-group row"><label for="cedger" class="col-md-4 col-form-label">Geriatra Cédula</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.cedger} id="cedger"  required /> </div> </div>

	<div class="form-group row"><label for="cedfammed" class="col-md-4 col-form-label">Médico Familiar Cédula</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.cedfammed} id="cedfammed"  required /> </div> </div>
</div>
	</div>
	</div>
</div>

<div class="row">
	
<div class="col">
	<div class="card">
	<div class="card-body">
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