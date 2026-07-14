<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser, permissions } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";

  import PositionsSearchList from "../controls/PositionsSearchList.svelte";
  import ListSelect from "../controls/ListSelect.svelte";
  import { options as WorkersPaymentperiodList } from "../controls/WorkersPaymentperiodListSelect";
  import { options as WorkersPayrollList } from "../controls/WorkersPayrollListSelect";
  import { options as WorkersStatusList } from "../controls/WorkersStatusListSelect";

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

  let showHistory = false;

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
      db.collection("workers")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
          } else {
            exists = true;
            values = query.data();
            values.id = query.id;
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
    if (typeof values.added === "string" || values.added instanceof String) {
      values.added = DateTime.fromISO(values.added).startOf("day").toJSDate();
    }

    if (tempId != null) {
      //Actualizar si tiene id
      values.edited = new Date();
      values.editedBy = $fbuser.uid;
      values.editedByName = $fbuser.displayName ?? "";
      if (!exists) {
        values.added = timenow;
        db.collection("workers")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      } else {
        

        // --- HISTORIAL DE EDICIONES ---
        if (!Array.isArray(values.history)) {
          values.history = [];
        }
        values.history.push({
          edited: new Date(),
          editedBy: $fbuser.uid,
          editedByName: $fbuser.displayName ?? ""
        });
        // -----------------------------
        db.collection("workers")
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
      db.collection("workers")
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
  <TitleBar title="Agregar Personal" base="Inventario" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="form-group row">
              <label for="folio" class="col-md-4 col-form-label"
                >Folio del Empleado</label
              >
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
              <label for="status" class="col-md-4 col-form-label">Estatus</label
              >
              <div class="col-md-4">
                <ListSelect
                  options={WorkersStatusList}
                  bind:value={values.status}
                  inlist={false}
                />
              </div>
            </div>

            <div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="active_serviceSwitch"
								bind:checked={values.active_share}
							/>
							<label
								class="custom-control-label"
								for="active_serviceSwitch">Compartida</label
							>
						</div>

            <div class="form-group row">
              <label for="cel" class="col-md-4 col-form-label">Celular</label>
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.cel}
                  id="cel"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="birth" class="col-md-4 col-form-label"
                >Fecha de nacimiento</label
              >
              <div class="col-md-8">
                <input
                  class="form-control"
                  type="date"
                  bind:value={values.birth}
                  id="birth"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="start_date" class="col-md-4 col-form-label"
                >Fecha de entrada</label
              >
              <div class="col-md-8">
                <input
                  class="form-control"
                  type="date"
                  bind:value={values.start_date}
                  id="start_date"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="address" class="col-md-4 col-form-label"
                >Dirección</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.address}
                  id="address"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="email" class="col-md-4 col-form-label">Email</label>
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.email}
                  id="email"
                />
              </div>
            </div>

            <div class="custom-control custom-switch mb-2" dir="ltr">
              <input
                type="checkbox"
                class="custom-control-input"
                id="hasimssSwitch"
                bind:checked={values.hasimss}
              />
              <label class="custom-control-label" for="hasimssSwitch"
                >Prestación IMSS</label
              >
            </div>
            <div class="form-group row">
              <label for="imss" class="col-md-4 col-form-label"
                >Número de IMSS</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.imss}
                  id="imss"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="pay" class="col-md-4 col-form-label">Pago base</label>
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
              <label for="phone" class="col-md-4 col-form-label"
                >Teléfono casa</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.phone}
                  id="phone"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="position" class="col-md-4 col-form-label"
                >Puesto</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="text"
                  bind:value={values.position}
                  id="position"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="vacation" class="col-md-4 col-form-label"
                >Días de vacaciones</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.vacation}
                  id="vacation"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="options" class="col-12 col-form-label"
                >Sueldo Especial</label
              >
            </div>
            <div class="form-group row">
              <div class="col-12">
                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Puesto</th>
                        <th>Pago</th>

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
                            <td>{subfield.pay}</td>
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
                            type="number"
                            bind:value={adder.pay}
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
                                pay: adder.pay,
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

            {#if $permissions.admin || $permissions.nominas  || $permissions.hr}
              <div class="form-group row">
                <label for="paymentperiod" class="col-md-4 col-form-label"
                  >Período de Pago</label
                >
                <div class="col-md-4">
                  <ListSelect
                    options={WorkersPaymentperiodList}
                    bind:value={values.paymentperiod}
                    inlist={false}
                  />
                </div>
              </div>

              <div class="form-group row">
                <label for="payroll" class="col-md-4 col-form-label"
                  >Pago de Nómina</label
                >
                <div class="col-md-4">
                  <ListSelect
                    options={WorkersPayrollList}
                    bind:value={values.payroll}
                    inlist={false}
                  />
                </div>
              </div>
            {/if}
          </div>

          <div class="card-body">
            <div class="form-group row">
              <div class="col-md-4 col-form-label">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  on:click={() => (showHistory = !showHistory)}
                >
                  {showHistory ? "Ocultar historial de ediciones" : "Ver historial de ediciones"}
                </button>
              </div>
            </div>
          </div>

          {#if showHistory && values.history && values.history.length > 0}
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm mb-0">
                  <thead class="thead-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Nombre</th>
                      <th>UserId</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each values.history as historyItem}
                      <tr>
                        <!-- <td>{new Date(historyItem.edited).toLocaleString()}</td> -->
                        <td>
                          {#if historyItem.edited && historyItem.edited.toDate}
                            {historyItem.edited.toDate().toLocaleString("es-MX")}
                          {:else if historyItem.edited instanceof Date}
                            {historyItem.edited.toLocaleString("es-MX")}
                          {:else}
                            -
                          {/if}
                        </td>
                        <td>{historyItem.editedByName}</td>
                        <td>{historyItem.editedBy}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {:else if showHistory}
            <div class="card-body">
              <div class="alert alert-info mb-0">
                No hay historial de ediciones registrado.
              </div>
            </div>
          {/if}
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
