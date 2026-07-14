<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";

  import ImageField from "../controls//ImageField.svelte";
  import BranchesReport from "../controls/BranchesReport.svelte";
  import PositionsSearchList from "../controls/PositionsSearchList.svelte";

  function checkVisibles() {}

  export let params = {};
  export let values = {
    groups: 2,
  };
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
    //console.log("filter : "+filterName+" == "+filterValue)
    values[filterName] = filterValue;
  }

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
      db.collection("branches")
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

    if (tempId != null) {
      //Actualizar si tiene id
      if (!exists) {
        values.added = timenow;
        db.collection("branches")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      } else {
        values.edited = timenow;
        db.collection("branches")
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
      db.collection("branches")
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
  <TitleBar title="Agregar Sucursal" base="Inventario" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="form-group row">
              <label for="residents" class="col-md-4 col-form-label"
                >Residentes</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.residents}
                  id="residents"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="device" class="col-md-4 col-form-label"
                >Numero Aparato</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.device}
                  id="device"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="name" class="col-md-4 col-form-label">Nombre</label>
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.name}
                  id="name"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="name" class="col-md-4 col-form-label">Escaner Activo</label>
              <div class="col-md-8 input-group">
                <div
                  class="custom-control custom-switch mb-2"
                  dir="ltr"
                >
                  <input
                    type="checkbox"
                    class="custom-control-input"
                    id="active_serviceSwitch"
                    bind:checked={values.active_service}
                  />
                  <label
                    class="custom-control-label"
                    for="active_serviceSwitch">Activo</label
                  >
                </div>
              </div>
            </div>

            <div class="form-group row">
              <label for="folio" class="col-md-4 col-form-label">Folio</label>
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.folio}
                  id="folio"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="map" class="col-12 col-form-label"
                >Imagen de Mapa de habitaciones</label
              >
              <div class="col-12">
                <ImageField
                  bind:value={values.map}
                  node={values.id}
                  baseId={"map"}
                  type={"file"}
                  num={1}
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="salesforceId" class="col-md-4 col-form-label"
                >Id en Salesforce</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.salesforceId}
                  id="salesforceId"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="groups" class="col-md-4 col-form-label"
                >Grupos de trabajo</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.groups}
                  id="groups"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="turn_day" class="col-md-4 col-form-label"
                >Inicio de turno Dia</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="time"
                  bind:value={values.turn_day}
                  id="turn_day"
                />
              </div>
            </div>
            <div class="form-group row">
              <label for="turn_night" class="col-md-4 col-form-label"
                >Inicio de turno Noche</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="time"
                  bind:value={values.turn_night}
                  id="turn_night"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="options" class="col-12 col-form-label"
                >Horarios especiales</label
              >
            </div>
            <div class="form-group row">
              <div class="col-12">
                <div class="table-responsive2">
                  <table class="table table-sm mb-0">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Puesto</th>
                        <th>Hora de inicio</th>

                        <th>Acciones</th>
                      </tr>
                    </thead>
                    {#if values.options != undefined}
                      <tbody>
                        {#each values.options as subfield, sfk}
                          <tr>
                            <th scope="row">{sfk + 1}</th>
                            <td
                              ><PositionsSearchList
                                value={subfield.positions}
                                inlist={true}
                              /></td
                            >
                            <td>{subfield.turn_day}</td>
                            <td>
                              <button
                                type="button"
                                class="btn btn-outline-error"
                                on:click={() => {
                                  deleteFromTable("options", sfk);
                                }}><i class="fas fa-times" /></button
                              >
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    {/if}
                    <tr id="addoptions">
                      <td>+</td>
                      <td
                        ><PositionsSearchList
                          bind:value={adder.positions}
                        /></td
                      ><td
                        ><div class="input-group">
                          <input
                            class="form-control"
                            type="time"
                            bind:value={adder.turn_day}
                            id="pay"
                          />
                        </div></td
                      >
                      <td>
                        <div class="font-icon-wrapper">
                          <button
                            type="button"
                            class="btn btn-outline"
                            on:click={() => {
                              addToTable("options", {
                                positions: adder.positions,
                                turn_day: adder.turn_day,
                              });
                            }}><i class="fas fa-plus" /></button
                          >
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>

            <div class="form-group row">
              <label for="options" class="col-12 col-form-label"
                >Horarios revisiones nocturnas</label
              >
            </div>
            <div class="form-group row">
              <div class="col-12">
                <div class="table-responsive2">
                  <table class="table table-sm mb-0">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Hora de inicio</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    {#if values.night != undefined}
                      <tbody>
                        {#each values.night as subfield, sfk}
                          <tr>
                            <th scope="row">{sfk + 1}</th>
                            <td>{subfield.night_hour}</td>
                            <td>
                              <button
                                type="button"
                                class="btn btn-outline-error"
                                on:click={() => {
                                  deleteFromTable("night", sfk);
                                }}><i class="fas fa-times" /></button
                              >
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                    {/if}
                    <tr id="addoptions">
                      <td>+</td>
                      <td
                        ><div class="input-group">
                          <input
                            class="form-control"
                            type="time"
                            bind:value={adder.night_hour}
                            id="pay"
                          />
                        </div></td
                      >
                      <td>
                        <div class="font-icon-wrapper">
                          <button
                            type="button"
                            class="btn btn-outline"
                            on:click={() => {
                              addToTable("night", {
                                night_hour: adder.night_hour,
                              });
                            }}><i class="fas fa-plus" /></button
                          >
                        </div>
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
