<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import { permissions } from "../stores.js";

  import { branches } from "../controls/branches.js";
  import BranchesSearchList from "../controls/BranchesSearchList.svelte";
  import { positions } from "../controls/positions.js";
  import PositionsSearchList from "../controls/PositionsSearchList.svelte";

  export let params = {};
  export let values = {};
  export let autoAdd = false;
  export let buttons = true;
  export let onBack = () => {
    pop();
  };

  let old = {};
  let adder = {};
  let exists = false;

  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;

  const tempId = params.bid;
  console.log("Editing workrole: " + tempId);
  if (filterName != undefined && filterValue != undefined) {
    //console.log("filter : "+filterName+" == "+filterValue)
    values[filterName] = filterValue;
  }

  let additionalShifts = 0;
  let patientEntries = 0;

  async function calculateAdditionalShifts() {
      // Solo calcular si hay una sucursal seleccionada
      if (!values.branches) {
          patientEntries = 0;
          additionalShifts = 0;
          return;
      }

      const startOfMonth = window.DateTime.local().plus({ months: 1 }).startOf('month').toFormat('yyyy-MM-dd');
      const endOfMonth = window.DateTime.local().plus({ months: 1 }).endOf('month').toFormat('yyyy-MM-dd');

      console.log("Start of current month:", startOfMonth);
      console.log("End of current month:", endOfMonth);

      try {
          const snapshot = await db.collection('patients')
              .where('entrydate', '>=', startOfMonth)
              .where('entrydate', '<=', endOfMonth)
              .where('branch', '==', values.branches) // Filtrar por sucursal
              .get();

          snapshot.forEach(doc => {
              console.log("Patient entrydate:", doc.data().entrydate);
          });

          console.log("Number of entries found:", snapshot.size); // Verificar el número de resultados

          patientEntries = snapshot.size;
          additionalShifts = patientEntries * 2;
      } catch (error) {
          console.error('Error fetching patient entries:', error);
      }
  }

  // Reactividad: recalcular cuando cambie la sucursal
  $: if (values.branches) {
      calculateAdditionalShifts();
  }

  // async function calculateAdditionalShifts() {
  //     const startOfMonth = window.DateTime.local().startOf('month').toFormat('yyyy-MM-dd'); // Convertir a formato string
  //     const endOfMonth = window.DateTime.local().endOf('month').toFormat('yyyy-MM-dd'); // Convertir a formato string

  //     console.log("Start of month:", startOfMonth);
  //     console.log("End of month:", endOfMonth);

  //     try {
  //         const snapshot = await db.collection('patients')
  //             .where('entrydate', '>=', startOfMonth)
  //             .where('entrydate', '<=', endOfMonth)
  //             .where('branch', '==', values.branches) // Filtrar por sucursal
  //             .get();

  //         snapshot.forEach(doc => {
  //             console.log("Patient entrydate:", doc.data().entrydate);
  //         });

  //         console.log("Number of entries found:", snapshot.size); // Verificar el número de resultados

  //         patientEntries = snapshot.size;
  //         additionalShifts = patientEntries * 2;
  //     } catch (error) {
  //         console.error('Error fetching patient entries:', error);
  //     }
  // }

  onMount(() => {
    form = document.getElementById("form");
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
      db.collection("workroles")
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
    calculateAdditionalShifts();
  });

  function cancel() {
    onBack();
  }

  function updateData() {
    if (!form.checkValidity()) {
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
      if (!exists) {
        values.added = timenow;
        db.collection("workroles")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      } else {
        values.edited = timenow;
        db.collection("workroles")
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
      values.createdName = $fbuser.displayName ?? "";
      db.collection("workroles")
        .add(values)
        .then(function () {
          loading = false;
          onBack();
        });
    }
  }
  function setField(field, value) {
    values[field] = value;
    values = values;
  }

  function addToTable(field, adderValues) {
    if (values[field] == undefined) {
      values[field] = [];
    }
    values[field].push(adderValues);
    values = values;
    adder = {};
  }
  function deleteFromTable(field, idx) {
    if (values[field] != undefined) {
      values[field].splice(idx, 1);
    }
    values = values;
  }

  function onAction(event) {
    const action = event.detail;
    if (action == "save") {
      //console.log("saved");
      updateData();
    }
  }
</script>

<div class="page-content modal-body">
  <TitleBar title="Agregar Puesto en sucursal" base="Inventario" />
  <form id="form">
    <div class="row">
      <div class="col-md-12 col-xl-4">
        <div class="card">
          <div class="card-body">
            <div class="form-group row">
              <label for="#select-branches" class="col-md-4 col-form-label"
                >Sucursal</label
              >
              <div class="col-md-8">
                <BranchesSearchList
                  bind:value={values.branches}
                  inlist={true}
                  fields={["avatar"]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Datos de puesto</h3>

            <div class="custom-control custom-switch mb-2" dir="ltr">
              <input
                type="checkbox"
                class="custom-control-input"
                id="shift_nightSwitch"
                bind:checked={values.shift_night}
              />
              <label class="custom-control-label" for="shift_nightSwitch"
                >Disponible de noche</label
              >
            </div>
            <div class="form-group row">
              <label for="pay" class="col-md-4 col-form-label">Sueldo</label>
              <div class="col-md-8 input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input
                  class="form-control input-mask"
                  type="number"
                  bind:value={values.pay}
                  id="pay"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="#select-positions" class="col-md-4 col-form-label"
                >Puesto</label
              >
              <div class="col-md-8">
                <PositionsSearchList bind:value={values.positions} />
              </div>
            </div>

            {#if $permissions.admin || $permissions.operations}
            <div class="form-group row">
              <label for="pay" class="col-md-4 col-form-label">Límite de guardias</label>
              <div class="col-md-8 input-group">
                <!-- <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div> -->
                <input
                  class="form-control input-mask"
                  type="number"
                  bind:value={values.limitShifts}
                  id="limitShifts"
                />
              </div>
            </div>
            {/if}

            <div class="form-group row">
              <label class="col-md-4 col-form-label"></label>
              <div class="col-md-8">
                {#if patientEntries > 0}
                  <small class="text-info">
                    <i class="bx bx-info-circle"></i>
                    Se han detectado {patientEntries} ingresos este mes, lo que añade {additionalShifts} guardias adicionales al límite base.
                  </small>
                {:else if values.branches}
                  <small class="text-muted">
                    No se han detectado ingresos este mes para esta sucursal.
                  </small>
                {/if}
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
            disabled={loading}
          >
            {#if loading}<i
                class="bx bx-loader bx-spin font-size-16 align-middle mr-2"
              ></i>{/if}
            Guardar</button
          >
          {#if loading}
            <div class="spinner-grow text-secondary m-1" role="status">
              <span class="sr-only">Guardando...</span>
            </div>
          {/if}
          <button
            on:click={cancel}
            class="btn btn-light waves-effect waves-light"
            disabled={loading}
          >
            Cancelar</button
          >
        </div>
      </div>
    </div>
    <!-- end col -->
  </div>
  <!-- end row -->
{/if}
