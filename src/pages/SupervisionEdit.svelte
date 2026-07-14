<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";

  import { branches } from "../controls/branches";
  import BranchesSearchList from "../controls/BranchesSearchList.svelte";
  import { checklist, cleaningChecklist } from "../Utils/checks";
  import SupervisionCheckListSelect from "../controls/SupervisionCheckListSelect.svelte";
  import SupervisionCheck_0ListSelect from "../controls/SupervisionCheck_0ListSelect.svelte";
  import SupervisionCheck_1ListSelect from "../controls/SupervisionCheck_1ListSelect.svelte";
  import SupervisionCheck_2ListSelect from "../controls/SupervisionCheck_2ListSelect.svelte";
  import SupervisionCheck_3ListSelect from "../controls/SupervisionCheck_3ListSelect.svelte";
  import SupervisionCheck_4ListSelect from "../controls/SupervisionCheck_4ListSelect.svelte";
  import SupervisionCheck_5ListSelect from "../controls/SupervisionCheck_5ListSelect.svelte";
  import SupervisionCheck_6ListSelect from "../controls/SupervisionCheck_6ListSelect.svelte";
  import SupervisionCheck_laundryListSelect from "../controls/SupervisionCheck_laundryListSelect.svelte";
  import SupervisionCheck_laundry_1ListSelect from "../controls/SupervisionCheck_laundry_1ListSelect.svelte";
  import SupervisionCheck_laundry_2ListSelect from "../controls/SupervisionCheck_laundry_2ListSelect.svelte";
  import SupervisionCheck_laundry_3ListSelect from "../controls/SupervisionCheck_laundry_3ListSelect.svelte";
  import SupervisionClean_0ListSelect from "../controls/SupervisionClean_0ListSelect.svelte";
  import SupervisionClean_0_1ListSelect from "../controls/SupervisionClean_0_1ListSelect.svelte";
  import SupervisionClean_0_1_devicesListSelect from "../controls/SupervisionClean_0_1_devicesListSelect.svelte";
  import SupervisionClean_0_1_gardenListSelect from "../controls/SupervisionClean_0_1_gardenListSelect.svelte";
  import SupervisionClean_0_1_kitchenListSelect from "../controls/SupervisionClean_0_1_kitchenListSelect.svelte";
  import SupervisionClean_0_1_roomsListSelect from "../controls/SupervisionClean_0_1_roomsListSelect.svelte";
  import SupervisionClean_0_2ListSelect from "../controls/SupervisionClean_0_2ListSelect.svelte";
  import SupervisionClean_0_2_devicesListSelect from "../controls/SupervisionClean_0_2_devicesListSelect.svelte";
  import SupervisionClean_0_2_gardenListSelect from "../controls/SupervisionClean_0_2_gardenListSelect.svelte";
  import SupervisionClean_0_2_kitchenListSelect from "../controls/SupervisionClean_0_2_kitchenListSelect.svelte";
  import SupervisionClean_0_2_roomsListSelect from "../controls/SupervisionClean_0_2_roomsListSelect.svelte";
  import SupervisionClean_0_3ListSelect from "../controls/SupervisionClean_0_3ListSelect.svelte";
  import SupervisionClean_0_3_devicesListSelect from "../controls/SupervisionClean_0_3_devicesListSelect.svelte";
  import SupervisionClean_0_3_gardenListSelect from "../controls/SupervisionClean_0_3_gardenListSelect.svelte";
  import SupervisionClean_0_3_kitchenListSelect from "../controls/SupervisionClean_0_3_kitchenListSelect.svelte";
  import SupervisionClean_0_3_roomsListSelect from "../controls/SupervisionClean_0_3_roomsListSelect.svelte";
  import SupervisionClean_0_4ListSelect from "../controls/SupervisionClean_0_4ListSelect.svelte";
  import SupervisionClean_0_4_devicesListSelect from "../controls/SupervisionClean_0_4_devicesListSelect.svelte";
  import SupervisionClean_0_4_gardenListSelect from "../controls/SupervisionClean_0_4_gardenListSelect.svelte";
  import SupervisionClean_0_4_kitchenListSelect from "../controls/SupervisionClean_0_4_kitchenListSelect.svelte";
  import SupervisionClean_0_4_roomsListSelect from "../controls/SupervisionClean_0_4_roomsListSelect.svelte";
  import SupervisionClean_0_5ListSelect from "../controls/SupervisionClean_0_5ListSelect.svelte";
  import SupervisionClean_0_5_gardenListSelect from "../controls/SupervisionClean_0_5_gardenListSelect.svelte";
  import SupervisionClean_0_5_kitchenListSelect from "../controls/SupervisionClean_0_5_kitchenListSelect.svelte";
  import SupervisionClean_0_5_roomsListSelect from "../controls/SupervisionClean_0_5_roomsListSelect.svelte";
  import SupervisionClean_0_6ListSelect from "../controls/SupervisionClean_0_6ListSelect.svelte";
  import SupervisionClean_0_6_kitchenListSelect from "../controls/SupervisionClean_0_6_kitchenListSelect.svelte";
  import SupervisionClean_0_7ListSelect from "../controls/SupervisionClean_0_7ListSelect.svelte";
  import SupervisionClean_0_7_kitchenListSelect from "../controls/SupervisionClean_0_7_kitchenListSelect.svelte";
  import SupervisionClean_0_devicesListSelect from "../controls/SupervisionClean_0_devicesListSelect.svelte";
  import SupervisionClean_0_gardenListSelect from "../controls/SupervisionClean_0_gardenListSelect.svelte";
  import SupervisionClean_0_kitchenListSelect from "../controls/SupervisionClean_0_kitchenListSelect.svelte";
  import SupervisionClean_0_roomsListSelect from "../controls/SupervisionClean_0_roomsListSelect.svelte";
  import SupervisionHead from "../controls/SupervisionHead.svelte";
  import SupervisionObservations from "../controls/SupervisionObservations.tw.svelte";
  import Head_buttons_footOptions from "../controls/Head_buttons_footOptions.svelte";
  import SupervisionSteps from "../controls/SupervisionSteps.svelte";
  import StepOptions from "../controls/StepOptions.svelte";
  import "iconify-icon";
    import SupervisionStepsNew from "../controls/SupervisionStepsNew.tw.svelte";

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

  $: values, generateObs();

  function generateObs() {
    console.log("generateObs", values);
    let obs = [];
    for (let c = 0; c < checklist.length; c++) {
      const element = checklist[c];
      for (let s = 0; s < element.checks.length; s++) {
        const check = element.checks[s];
        if (values[c + "-" + s] != undefined && values[c + "-" + s] == 0) {
          let extra = "";
          if (values[c + "msg-" + s] != undefined) {
            extra = ". "+values[c + "msg-" + s];
          }
          obs.push(element.area + ". Revisar: " + check+extra);
        }
      }
    }
    for (let c = 0; c < cleaningChecklist.length; c++) {
      const element = cleaningChecklist[c];
      for (let s = 0; s < element.checks.length; s++) {
        const check = element.checks[s];
        if (values[c + "c-" + s] != undefined && values[c + "c-" + s] == 0) {
          let extra = "";
          if (values[c + "cmsg-" + s] != undefined) {
            extra = ". "+values[c + "cmsg-" + s];
          }
          obs.push(element.area + ". Revisar: " + check+extra);
        }
      }
    }
    if (values.obs == undefined || values.obs.length != obs.length) {
      values.obs = obs;
      values = values;
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
      db.collection("supervision")
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
  async function addObs() {
    if (values.obs == undefined || values.obs.length == 0) {
      return;
    }

    for (let o = 0; o < values.obs.length; o++) {
      const element = values.obs[o];
      await db.collection("supervision_obs").add({
        name: element,
        branches: values.branches,
        added: timenow,
        status: 0,
        completed: false,
        createdBy: $fbuser.uid,
        createdName: $fbuser.displayName ?? "",
      });
    }
  }

  async function updateData() {
    console.log("updateData");
    // if (!form.checkValidity()) {
    //   form.reportValidity();
    //   /*
    //     jQuery(".tab-pane").length
    //     for(var elem of form.elements){
    //       if(!elem.checkValidity()){
    //         $('.nav-tabs a[href="#personal-tab"]').tab('show');
    //         form.reportValidity();
    //         console.log(elem);
    //       }
    //     };
    //   */
    //   return;
    // }
    if (checkVisibles != undefined) {
      checkVisibles();
    }
    loading = true;
    await addObs();
    if (tempId != null) {
      //Actualizar si tiene id
      if (!exists) {
        values.added = timenow;
        db.collection("supervision")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      } else {
        values.edited = timenow;
        db.collection("supervision")
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
      db.collection("supervision")
        .add(values)
        .then(function () {
          loading = false;
          onBack();
        });
      console.log("saved");
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
    // const action = event.detail;
    // if (action == "save") {
    //console.log("saved");
    console.log("onAction");
    updateData();
    // }
  }
</script>

<div class="page-content modal-body">
  <TitleBar title="Agregar Inspecciones de Supervisión" base="Inventario" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body"></div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Aspectos</h3>

            <div class="form-group row">
              <div class="col-12">
                <SupervisionStepsNew
                  on:change={(event) => {
                    setField("step", event.detail.value);
                  }}
                  bind:data={values}
                  inlist={true}
                  on:action={onAction}
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="#select-branches" class="col-md-4 col-form-label"
                >Estas generando reporte de la estancia</label
              >
              <div class="col-md-8">
                <BranchesSearchList bind:value={values.branches} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {#each checklist as check, cdx}
      <div class="col {values.step == 0 ? '' : 'hidden'}">
        <div class="card">
          <div class="card-body">
            <h3>
              {#if check.icon != undefined}
                <iconify-icon
                  icon={check.icon}
                  style="font-size: 1.5em; margin-right: 0.5em; color:#ccc"
                ></iconify-icon>
              {/if}
              {check.area}
            </h3>

            {#each check.checks as sup, idx}
              <div class="form-group row">
                <label for="clean_0" class="col-md-4 col-form-label">
                  <p style="margin-bottom: 0;">{sup}</p>
                  <p class="text-xs" style="color:#ccc; font-size:12px">
                    Mantenimiento
                  </p>
                </label>
                <div class="col-md-8 flex flex-col gap-2">
                  <SupervisionClean_0ListSelect
                    bind:value={values[cdx + "-" + idx]}
                    inlist={false}
                    view={"check"}
                    prefix={cdx + "-" + idx}
                  />
                  {#if values[cdx + "-" + idx] == 0}
                    <h5 >Observaciones</h5>
                    <textarea name="" id="" bind:value={values[cdx + "msg-" + idx]} style="width: 100%;"></textarea>
                  {/if}
                </div>
              </div>
            {/each}
            <hr class="color:#606016 ; height 2px" />
            {#each cleaningChecklist as cc, ccdx}
              {#if cc.area == check.area}
                {#each cc.checks as sup, idx}
                  <div class="form-group row">
                    <label for="clean_0" class="col-md-4 col-form-label">
                      <p style="margin-bottom: 0;">{sup}</p>
                      <p class="text-xs" style="color:#ccc; font-size:12px">
                        Limpieza
                      </p>
                    </label>
                    <div class="col-md-8">
                      <SupervisionClean_0ListSelect
                        bind:value={values[cdx + "c-" + idx]}
                        inlist={false}
                        view={"check"}
                        prefix={cdx + "c-" + idx}
                      />
                      {#if values[cdx + "c-" + idx] == 0}
                        <h5 >Observaciones</h5>
                        <textarea name="" id="" bind:value={values[cdx + "cmsg-" + idx]} style="width: 100%;"></textarea>
                      {/if}
                    </div>
                  </div>
                {/each}
              {/if}
            {/each}
          </div>
        </div>
      </div>
    {/each}

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Tareas para Mantenimiento</h3>

            <div class="form-group row">
              <div class="col-12">
                <SupervisionObservations
                  on:change={(event) => {
                    setField("head_buttons_foot", event.detail.value);
                  }}
                  bind:data={values}
                  inlist={false}
                  {onAction}
                />
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
            type="button"
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
            type="button"
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

<style>
  .hidden {
    display: block;
  }
</style>
