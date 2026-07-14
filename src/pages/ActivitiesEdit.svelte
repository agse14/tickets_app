<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser} from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import Select from 'svelte-select';
  import swal from 'sweetalert';
  // import { DateTime } from "luxon";
	
  import {branches} from "../controls/branches"
import BranchesSearchList from "../controls/BranchesSearchList.svelte"
import SupervisionTagsSearchList from "../controls/SupervisionTagsSearchList.svelte";
import {patients} from "../controls/patients"
import PatientSearchList from "../controls/PatientSearchList.svelte"
import FrecuencyCtrl from "../controls/FrecuencyCtrl.svelte"
import CleaningCtrl from "../controls/CleaningCtrl.svelte";
import PeriodOptions from "../controls/PeriodOptions.svelte"
    import ListSelect from "../controls/ListSelect.svelte";

 function checkVisibles(){
}


  export let params = {};
  export let values = {
    type:0,
  };
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
  let cleaningPositions = []; // Array para almacenar los puestos de limpieza
  let cleaningPositionsSelect = []; // Array para svelte-select
  let selectedCleaningPosition = null; // Objeto seleccionado para svelte-select

  let filterName = params.field;
  let filterValue = params.value;
  
  const tempId = params.bid;
  if(filterName != undefined && filterValue != undefined){
    values[filterName] = filterValue;
  }
  if(params.wild != undefined && params.wild != ""){
    let parray = params.wild.split("/");
    for (let p = 0; p < parray.length; p++) {
      const element = parray[p];
      if(p%2 == 0 && parray[p+1] != undefined && parray[p+1] != ""){
        //console.log("p ", p, element);
        values[element]=parray[p+1];
      }
    }
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
      db.collection("activities")
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
            
            // Si es una actividad de limpieza existente, cargar puestos de limpieza
            if (values.type === 1 && values.branches) {
              loadCleaningPositions(values.branches);
            }
          }
          loading = false;
        });
    }
  });
  
  // Reactivo: cargar puestos de limpieza cuando se seleccione tipo limpieza y ya hay estancia
  $: if (values.type === 1 && values.branches) {
    loadCleaningPositions(values.branches);
  }

  function handleCleaningPositionChange() {
    console.log("Cambio en selección:", selectedCleaningPosition);
    if (selectedCleaningPosition && selectedCleaningPosition.value) {
      values.cleaningPositionId = selectedCleaningPosition.value;
      values.cleaningNumber = selectedCleaningPosition.cleaningNumber;
      console.log("Puesto de limpieza seleccionado:", values.cleaningPositionId, "Número:", values.cleaningNumber);
    } else {
      values.cleaningPositionId = '';
      values.cleaningNumber = null;
      console.log("Puesto de limpieza limpiado");
    }
  }

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
    if (typeof values.added === 'string' || values.added instanceof String){
      values.added = DateTime.fromISO(values.added).startOf('day').toJSDate();
    }
    
    // Para actividades de limpieza, asegurar que se guarde el cleaningPositionId
    if (values.type === 1 && !values.cleaningPositionId) {
      console.log("Error: No hay cleaningPositionId seleccionado");
      console.log("selectedCleaningPosition:", selectedCleaningPosition);
      console.log("values.cleaningPositionId:", values.cleaningPositionId);
      console.log("cleaningPositionsSelect:", cleaningPositionsSelect);
      
      swal({
        title: "Campo requerido",
        text: "Por favor selecciona un puesto de limpieza específico.",
        icon: "warning",
        button: "Entendido"
      });
      loading = false;
      return;
    }

    // Log para verificar qué se está guardando
    if (values.type === 1) {
      console.log("=== GUARDANDO ACTIVIDAD DE LIMPIEZA ===");
      console.log("cleaningPositionId:", values.cleaningPositionId);
      console.log("cleaningNumber:", values.cleaningNumber);
      console.log("Objeto completo values:", values);
      console.log("=====================================");
    }
    
    if (tempId != null) {
      //Actualizar si tiene id
      if(!exists){
        values.added = timenow;
        db.collection("activities")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }else{
        values.edited = timenow;
        db.collection("activities")
          .doc(tempId)
          .update(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }
      
    } else {
      //Crear nuevo si no tiene
      if(values.added == undefined){
        values.added = timenow;
      }
      values.createdBy = $fbuser.uid;
      values.createdName = $fbuser.displayName ?? '';
      db.collection("activities")
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
    
    // Si se cambia la estancia y el tipo es limpieza, cargar puestos de limpieza
    if (field === 'branches' && values.type === 1) {
      // Solo limpiar la selección si realmente cambia de estancia
      const previousBranch = old.branches || null;
      if (value !== previousBranch) {
        values.cleaningPositionId = '';
        values.cleaningNumber = null;
        selectedCleaningPosition = null;
      }
      loadCleaningPositions(value);
    }
  }

  async function loadCleaningPositions(branchId) {
    if (!branchId) {
      cleaningPositions = [];
      cleaningPositionsSelect = [];
      selectedCleaningPosition = null;
      return;
    }

    // Guardar la selección actual antes de limpiar
    const currentSelection = selectedCleaningPosition;
    const currentCleaningPositionId = values.cleaningPositionId;

    // Limpiar la lista antes de cargar nuevos datos
    cleaningPositions = [];
    cleaningPositionsSelect = [];

    try {
      console.log("Cargando puestos de limpieza para branch:", branchId);
      
      // Primero, buscar todas las posiciones de limpieza/aseo
      const allPositions = await db.collection("positions").get();
      
      const cleaningPositionIds = [];
      allPositions.forEach((positionDoc) => {
        const positionData = positionDoc.data();
        const positionName = positionData.name.toLowerCase();
        
        // Identificar puestos de limpieza por palabras clave
        if (positionName.includes('limpieza') || 
            positionName.includes('aseo') || 
            positionName.includes('intendencia') || 
            positionName.includes('mantenimiento')) {
          cleaningPositionIds.push(positionDoc.id);
        }
      });

      console.log("IDs de posiciones de limpieza encontradas:", cleaningPositionIds);

      if (cleaningPositionIds.length === 0) {
        console.log("No se encontraron posiciones de limpieza");
        cleaningPositions = [];
        return;
      }

      // Ahora consultar workroles que tengan estas posiciones Y pertenezcan al branch
      const cleaningRoles = await db.collection("workroles")
        .where("branches", "==", branchId)
        .get();
      
      // Filtrar solo los workroles que tengan posiciones de limpieza
      cleaningPositions = [];
      cleaningPositionsSelect = [];
      
      let cleaningCounter = 1; // Contador para asignar números únicos
      
      cleaningRoles.forEach((roleDoc) => {
        const roleData = roleDoc.data();
        
        // Verificar si este workrole tiene una posición de limpieza
        if (roleData.positions && cleaningPositionIds.includes(roleData.positions)) {
          // Encontrar los datos de la posición
          const positionData = allPositions.docs.find(doc => doc.id === roleData.positions)?.data();
          
          const cleaningRole = {
            id: roleDoc.id, // Usar el ID del workrole
            name: `${positionData?.name || 'Sin nombre'}`,
            // name: `${roleData.name || 'Workrole'} - ${positionData?.name || 'Sin nombre'}`,
            data: roleData,
            positionData: positionData,
            cleaningNumber: cleaningCounter // Agregar número diferenciador
          };
          
          cleaningPositions.push(cleaningRole);
          
          // Agregar al array de svelte-select con el número diferenciador
          cleaningPositionsSelect.push({
            value: roleDoc.id,
            label: `#${cleaningCounter} - ${cleaningRole.name}`,
            cleaningNumber: cleaningCounter
          });
          
          cleaningCounter++; // Incrementar contador
        }
      });
      
      console.log("Workroles de limpieza encontrados:", cleaningPositions);
      
      // Si no hay workroles específicos, agregar uno por defecto
      if (cleaningPositions.length === 0) {
        cleaningPositions = [{ id: 'default', name: 'Limpieza General', data: {}, cleaningNumber: 1 }];
        cleaningPositionsSelect = [{ value: 'default', label: '#1 - Limpieza General', cleaningNumber: 1 }];
      }
      
      // Restaurar la selección si era válida para este branch
      if (currentCleaningPositionId) {
        const found = cleaningPositionsSelect.find(item => item.value === currentCleaningPositionId);
        if (found) {
          selectedCleaningPosition = found;
          console.log("Restaurando selección:", found);
        } else {
          selectedCleaningPosition = null;
          values.cleaningPositionId = '';
          values.cleaningNumber = null;
        }
      } else {
        selectedCleaningPosition = null;
      }
      
    } catch (error) {
      console.error("Error al consultar puestos de limpieza:", error);
      cleaningPositions = [{ id: 'default', name: 'Limpieza General', data: {} }];
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

  function onAction(event){
    const action = event.detail;
    if(action == "save"){
      //console.log("saved");
      updateData();
    }
  }
</script>

<div class="page-content modal-body">
  <TitleBar title="Agregar Actividades programadas" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-12">
	<div class="card">
<div class="card-body">
  <div class="form-group row">
    <label for="#select-type" class="col-md-4 col-form-label">
      Tipo de actividad
    </label>
    <div class="col-md-8">
      <ListSelect bind:value={values.type} options={["Huesped", "Limpieza", "Lavandería"]}  />
    </div> 
  </div>
  <div class="form-group row"><label for="#select-branches" class="col-md-4 col-form-label">Estancia</label>
    <div class="col-md-8"><BranchesSearchList bind:value={values.branches}  />
    </div> 
  </div>
  <div class="form-group row">
    <label for="name" class="col-md-4 col-form-label">
      Actividad
    </label>
    <div class="col-md-8 input-group">
      <input class="form-control " type="text" bind:value={values.name} id="name"  required /> 
    </div> 
  </div>
  {#if values.type == 1}
    <div class="form-group row">
      <label for="#select-branches" class="col-md-4 col-form-label">
        Sensor
      </label>
      <div class="col-md-8">
        <SupervisionTagsSearchList 
        branches={values.branches}
        bind:value={values.supervisionArea}  />
      </div> 
    </div>
    
    <!-- Selector de puesto de limpieza -->
    <div class="form-group row">
      <label for="#select-cleaning-position" class="col-md-4 col-form-label">
        Puesto de Limpieza
      </label>
      <div class="col-md-8">
        <Select 
          items={cleaningPositionsSelect} 
          bind:value={selectedCleaningPosition} 
          on:select={handleCleaningPositionChange}
          on:clear={handleCleaningPositionChange}
          placeholder="Seleccionar puesto..."
        />
        <small class="form-text text-muted">
          Selecciona el puesto específico de limpieza para esta actividad
        </small>
      </div> 
    </div>
  <!-- {:else} -->
  {/if}
    <!-- <div class="form-group row">
      <label for="name" class="col-md-4 col-form-label">
        Actividad
      </label>
      <div class="col-md-8 input-group">
        <input class="form-control " type="text" bind:value={values.name} id="name"  required /> 
      </div> 
    </div> -->
  <!-- {/if} -->
  <div class="custom-control custom-switch mb-2" dir="ltr">
    <input type="checkbox" class="custom-control-input" id="activeSwitch" bind:checked={values.active}>
    <label class="custom-control-label" for="activeSwitch">Activa</label>
  </div>
  
  {#if values.type == 0}
	<div class="form-group row"><label for="#select-patient" class="col-md-4 col-form-label">Huesped</label>
	<div class="col-md-8"><PatientSearchList bind:value={values.patient}  filter={(row)=>{ return row.branch == values.branches && (row.statusId == 0 || row.statusId == undefined);}} />
	</div> </div>
  {/if}

  {#if values.type == 1}
    <div class="form-group row">
      <div class="col-12">
        <CleaningCtrl 
          on:change={(event) => { setField("cleaningData", event.detail.value); }} 
          bind:data={values} 
          inlist={false}
          on:action={onAction}
          required 
        />
      </div>
    </div>
  {/if}

	<div class="form-group row"><div class="col-12"><FrecuencyCtrl on:change={(event)=>{setField("period",event.detail.value);}} bind:data={values} inlist={false} on:action={onAction}  required /> </div> </div>

	<div class="form-group row"><label for="endDate" class="col-md-4 col-form-label">Finaliza actividad</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.endDate} id="endDate"  /> </div> </div>

	
	<div class="form-group row"><label for="notes" class="col-md-4 col-form-label">Observaciones</label><div class="col-md-8 input-group"><input class="form-control " type="text" bind:value={values.notes} id="notes"  /> </div> </div>

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