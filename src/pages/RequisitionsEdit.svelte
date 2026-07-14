<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";

  import { branches } from "../controls/branches.js";
  import BranchSearchList from "../controls/BranchSearchList.svelte";
  import PositionsSearchList from "../controls/PositionsSearchList.svelte";
  import PatientlogDetailListSelect from "../controls/PatientlogDetailListSelect.svelte";
  import PatientlogTypeListSelect from "../controls/PatientlogTypeListSelect.svelte";
  import { workers } from "../controls/workers.js";
  import UidSearchList from "../controls/UidSearchList.svelte";

  function checkVisibles() {}

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
  if (filterName != undefined && filterValue != undefined) {
    values[filterName] = filterValue;
  }
  if (params.wild != undefined && params.wild != "") {
    let parray = params.wild.split("/");
    for (let p = 0; p < parray.length; p++) {
      const element = parray[p];
      if (p % 2 == 0 && parray[p + 1] != undefined && parray[p + 1] != "") {
        //console.log("p ", p, element);
        values[element] = parray[p + 1];
      }
    }
  }

  onMount(() => {
    form = document.getElementById("form");
    var defaultOptions = {};

    try{
        let vObject = window.localStorage.getItem("lastPatientlog");
        if(vObject != undefined && vObject != null){
          vObject = JSON.parse(vObject);
          if(vObject != undefined && vObject != null){
            if (values.uid != undefined && values.uid != '') {
              vObject.uid = values.uid;
            }
            values = vObject;
          }
        }

      }catch(e){
        console.log(e);
      }

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

      values.units = 1;
    } else {
      db.collection("requisitions")
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
    if (checkVisibles != undefined) {
      checkVisibles();
    }
    loading = true;
    if (tempId == null) {
      try{
        window.localStorage.setItem("lastPatientlog", JSON.stringify(values));
      }catch(e){
        console.log(e);
      }
    }

    if (typeof values.added === "string" || values.added instanceof String) {
      values.added = DateTime.fromISO(values.added).startOf("day").toJSDate();
    }

    if (tempId != null) {
      //Actualizar si tiene id
      if (!exists) {
        values.added = timenow;
        db.collection("requisitions")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      } else {
        values.edited = timenow;
        db.collection("requisitions")
          .doc(tempId)
          .update(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }
    } else {
      //Crear nuevo si no tiene
      if (values.added == undefined) {
        values.added = timenow;
      }
      values.createdBy = $fbuser.uid;
      values.createdName = $fbuser.displayName ?? "";
      db.collection("requisitions")
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
  <TitleBar title="Agregar Registros de pagos" base="Inventario" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="form-group row">
              <label for="added" class="col-md-4 col-form-label"
                >Fecha del concepto</label
              >
              <div class="col-md-8">
                <input
                  class="form-control"
                  type="date"
                  bind:value={values.added}
                  id="added"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="type" class="col-md-4 col-form-label"
                >Tipo de pago</label
              >
              <div class="col-md-4">
                <PatientlogTypeListSelect
                  bind:value={values.type}
                  inlist={false}
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="detail" class="col-md-4 col-form-label"
                >Concepto</label
              >
              <div class="col-md-4">
                <PatientlogDetailListSelect
                  bind:value={values.detail}
                  inlist={false}
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="#select-branch" class="col-md-4 col-form-label"
                >Sucursal</label
              >
              <div class="col-md-8">
                <BranchSearchList bind:value={values.branch} />
              </div>
            </div>

            <div class="form-group row">
              <label for="#select-branch" class="col-md-4 col-form-label"
                >Puesto</label
              >
              <div class="col-md-8">
                <PositionsSearchList bind:value={values.positions} />
              </div>
            </div>

            <div class="form-group row">
              <label for="amount" class="col-md-4 col-form-label">Monto</label>
              <div class="col-md-8 input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input
                  class="form-control input-mask"
                  type="number"
                  bind:value={values.amount}
                  id="amount"
                  step="0.01"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="units" class="col-md-4 col-form-label">Cantidad</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.units}
                  id="units"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="#select-uid" class="col-md-4 col-form-label"
                >Trabajadores</label
              >
              <div class="col-md-8">
                <UidSearchList bind:value={values.uid} />
              </div>
            </div>

            <div class="form-group row">
              <label for="notes" class="col-md-4 col-form-label">Notas</label>
              <div class="col-md-8">
                <textarea
                  class="form-control"
                  bind:value={values.notes}
                  id="notes"
                ></textarea>
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
              />{/if}
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
