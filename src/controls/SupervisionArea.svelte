<script>
    import { link } from "svelte-spa-router";
    import { pop } from "svelte-spa-router";
    import { fbuser } from "../stores.js";
    import TitleBar from "../TitleBar.svelte";
    import { onMount } from "svelte";
  
    import { branches } from "../controls/branches";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { checklist, cleaningChecklist } from "../Utils/checks";
    import SupervisionClean_0ListSelect from "../controls/SupervisionClean_0ListSelect.svelte";
    import SupervisionObservations from "./SupervisionObservations.tw.svelte";
    import Head_buttons_footOptions from "../controls/Head_buttons_footOptions.svelte";
    import SupervisionSteps from "../controls/SupervisionStepsNew.tw.svelte";
    import StepOptions from "../controls/StepOptions.svelte";
    import "iconify-icon";
  
    function checkVisibles() {}
  
    export let params = {};
    export let values = {};
    export let autoAdd = false;
    export let buttons = true;
    export let tempId = null;
    export let sensorId = null;
    export let onBack = () => {
      pop();
    };
  
    let old = {};
    let adder = {};
    let exists = false;
    let error = "";
  
    let loading = true;
    let area = "habitaciones";
    let areaId = "habitaciones";
    let room = "";
    let form;
  
    let filterName = params.field;
    let filterValue = params.value;
  
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
      
      let obs = [];
      let roomName = "";
      if(area == "habitaciones"){
        roomName = " - Cuarto "+room;
      }
      for (let c = 0; c < checklist.length; c++) {
        
        const element = checklist[c];
        if(element.area != area){
          continue;
        }
        for (let s = 0; s < element.checks.length; s++) {
          const check = element.checks[s];
          if (values[c + "-" + s] != undefined && values[c + "-" + s] == 0) {
            let extra = "";
            if (values[c + "msg-" + s] != undefined) {
              extra = ". "+values[c + "msg-" + s];
            }
            obs.push(element.area +roomName+ ". Revisar: " + check+extra);
          }
        }
      }
      for (let c = 0; c < cleaningChecklist.length; c++) {
        const element = cleaningChecklist[c];
        if(cleaningChecklist[c].area != area){
          continue;
        }
        for (let s = 0; s < element.checks.length; s++) {
          const check = element.checks[s];
          if (values[c + "c-" + s] != undefined && values[c + "c-" + s] == 0) {
            let extra = "";
            if (values[c + "cmsg-" + s] != undefined) {
              extra = ". "+values[c + "cmsg-" + s];
            }
            obs.push(element.area +roomName+ ". Revisar: " + check+extra);
          }
        }
      }
      if (values.obs == undefined || values.obs.length != obs.length) {
        values.obs = obs;
        values = values;
      }
      console.log("generateObs", values);
    }
  
    onMount(async () => {
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
      if (sensorId == null) {
        loading = false;
      } else {
        //load sensor data
        console.log("sensorId", sensorId);
        error = "";
        let sensorRef = await db.collection("supervision_tags").where("name", "==", sensorId).limit(1).get();
        let branchId = "";

        if (!sensorRef.empty) {
          branchId = sensorRef.docs[0].data()?.branches;
          // remove everything before the first slash
          if(sensorRef.docs[0].data()?.area != undefined){
            area = sensorRef.docs[0].data()?.area;
          }else{
              area = "habitaciones";
              room = sensorId.substring(sensorId.indexOf('-') + 1);
          }
        }else{
          let sensorBrach = sensorId.split("=");
          if(sensorBrach.length < 2){
            loading = false;
            error = "No se encontró la estancia";
            return;
          }
          let findBranch = await db.collection("branches").where("sensor", "==", sensorBrach[0]).limit(1).get();
          if (!findBranch.empty) {
            branchId = findBranch.docs[0].id;
            area = sensorBrach[1];
            room = "";
          }
        }

        if (branchId == undefined || branchId == "") {
            loading = false;
            error = "No se encontró la estancia";
            return;
        }
        let query = await db.collection("supervision")
          .where("branches", "==", branchId)
          .where("added", ">=", new DateTime.local().startOf('day').toJSDate())
          .get();
        // console.log("query",branchId, query.docs, new DateTime.local().startOf('day').toJSDate());
        areaId = area;
        if(area == "habitaciones"){
            areaId = area+"-"+room;
        }
        if (query.empty) {
            //No data crear
            //pop();
            values.branches = branchId;
            // values[areaId] = true;
        } else {
            exists = true;
            values = query.docs[0].data();
            tempId = query.docs[0].id;
            values.branches = branchId;
            console.log("values", values);
            // values[areaId] = true;
            old = query.docs[0].data();
            
        }
        loading = false;
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
      values[areaId] = true;
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
    <form id="form">
  
      <div class="row">
        <div class="col">
          <div class="card">
            <div class="card-body">
              <h3>Revisión</h3>
              {error}
              <div class="form-group row">
                <label for="#select-branches" class="col-md-4 col-form-label"
                  >Estas generando reporte de la estancia</label
                >
                <div class="col-md-8">
                  <BranchesSearchList bind:value={values.branches} inlist={true} />
                </div>
              </div>
              <div class="row">
                <div class="col-12">
                  <SupervisionSteps
                    bind:data={values}
                    inlist={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {#each checklist as check, cdx}
        {#if check.id == area}
        <div class="col {values.step == 0 ? '' : 'hidden'}">
          <div class="card">
            <div class="card-body">
              <h3>
                {#if check.icon != undefined}
                  <iconify-icon
                    icon={check.icon}
                    style="font-size: 1.5em; margin-right: 0.5em; { values[areaId] == true ?'color:#afa':'color:#ccc'} "
                  ></iconify-icon>
                {/if}
                {check.area} - {room}
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
                      bind:value={values[cdx + "-" + idx+room]}
                      inlist={false}
                      view={"check"}
                      prefix={cdx + "-" + idx+room}
                    />
                    {#if values[cdx + "-" + idx+room] == 0}
                      <h5 >Observaciones</h5>
                      <textarea name="" id="" bind:value={values[cdx + "msg-" + idx+room]} style="width: 100%;"></textarea>
                    {/if}
                  </div>
                </div>
              {/each}
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
                          bind:value={values[cdx + "c-" + idx+room]}
                          inlist={false}
                          view={"check"}
                          prefix={cdx + "c-" + idx+room}
                        />
                        {#if values[cdx + "c-" + idx+room] == 0}
                          <h5 >Observaciones</h5>
                          <textarea name="" id="" bind:value={values[cdx + "cmsg-" + idx+room]} style="width: 100%;"></textarea>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {/if}
              {/each}
            </div>
          </div>
        </div>
        {/if}
      {/each}
        {#if values[areaId] != true}
      <div class="row">
        <div class="col">
          <div class="card">
            <div class="card-body">
              <h5>Tareas para Mantenimiento</h5>
  
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
      {/if}
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
  