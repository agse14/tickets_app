<script>
  import { link, push } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount, afterUpdate, beforeUpdate } from "svelte";

  import { branches } from "../controls/branches.js";
  import BranchesSearchList from "../controls/BranchesSearchList.svelte";
  import { patients } from "../controls/patients.js";
  import PatientsSearchList from "../controls/PatientsSearchList.svelte";
  import { workers } from "../controls/workers.js";
  import WorkersSearchList from "../controls/WorkersSearchListFiltered.svelte";
  import IncidentStatusListSelect from "../controls/IncidentStatusListSelect.svelte";
  import IncidentTypeListSelect from "../controls/IncidentTypeListSelect.svelte";
  import IncidentDetailListSelect from "../controls/IncidentDetailListSelect.svelte";
  import Supervision_obsStatusListSelect from "../controls/Supervision_obsStatusListSelect.svelte";
  import Supervision_obsOtherListSelect from "../controls/Supervision_obsOtherListSelect.svelte";

  export let params = {};
  export let values = { status: 0 };
  export let autoAdd = false;
  export let buttons = true;
  export let hideTitle = false;
  export let onBack = () => {
    push("/incidents-rh");
  };

  let old = {};
  let adder = {};
  let exists = false;

  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;
  let showFields = false;

  // Variable reactivas para el tipo y el título
  let type = params.tid;
  let title = "Reporte de Incidencias"; // Inicialización del título
  let typeurl;

  const tempId = params.bid;

  // Si hay un filtro, asignamos el valor correspondiente a `values`
  if (filterName != undefined && filterValue != undefined) {
    values[filterName] = filterValue;
  }

  // Función que se ejecuta cuando la ruta cambia
  function handleNavigation() {
    console.log("params", params);

    type = params.tid; // Actualiza el valor de 'type' cada vez que la URL cambie
    title = getTitleByType(type); // Actualiza el título cada vez que la URL cambie
  }

  // Obtener título dinámico basado en el tipo
  function getTitleByType(type) {
    const titles = {
      0: "Reporte de Inconformidad",
      1: "Reporte de Paciente",
      2: "Reporte de Seguridad",
      3: "Reporte de Accidente",
      4: "Reporte de Familiar",
      5: "Reporte de Personal",
    };

    return titles[type] || "Reporte de Incidencias";
  }

  // Función de inicialización al montar el componente
  onMount(() => {
    handleNavigation(); // Llamamos a handleNavigation para obtener el tipo de la URL

    // Inicialización del formulario
    form = document.getElementById("form");
    var defaultOptions = {};

    // touchspin (para manejar los inputs de tipo número con controles)
    jQuery('[data-toggle="touchspin"]').each(function (idx, obj) {
      var objOptions = jQuery.extend({}, defaultOptions, jQuery(obj).data());
      jQuery(obj)
        .TouchSpin(objOptions)
        .on("change", function () {
          newResidents = this.value;
        });
    });

    jQuery(".input-mask").inputmask(); // Máscara de entrada para campos como teléfono

    // Si 'tempId' está definido, cargamos los datos del incidente
    if (tempId == null) {
      loading = false; // No se necesita cargar datos si no hay 'tempId'
    } else {
      db.collection("incident")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            // No data found, create new
          } else {
            exists = true;
            values = query.data(); // Asigna los datos obtenidos de Firestore
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
      return;
    }
    loading = true;

    if (tempId != null) {
      //Actualizar si tiene id
      if (!exists) {
        values.added = timenow;
        db.collection("incident")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            onBack();
          });
      } else {
        values.edited = timenow;
        db.collection("incident")
          .doc(tempId)
          .update(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }
    } else {
      // Crear nuevo si no tiene
      // Consultamos el último folio
      db.collection("incident")
        .orderBy("folio", "desc") // Ordenar por folio de manera descendente
        .limit(1) // Limitar a 1 registro
        .get()
        .then((querySnapshot) => {
          let highestFolio = 0;
          if (!querySnapshot.empty) {
            highestFolio = querySnapshot.docs[0].data().folio; // Obtener el folio más alto
          }

          // Asignar el nuevo folio incrementado en 1
          values.folio = highestFolio + 1;

          // Asignar la fecha de creación y el creador
          if (values.added == undefined) {
            values.added = timenow;
          }
          values.createdBy = $fbuser?.uid ?? "anonymous";
          values.createdName = $fbuser?.displayName ?? "";
          values.type = type; // Asignar el tipo de incidente

          // Guardamos el nuevo registro en la base de datos
          db.collection("incident")
            .add(values)
            .then(function () {
              loading = false;
              onBack();
            });
        });
    }
  }

  // Se ejecuta antes de cada actualización del DOM
  beforeUpdate(() => {
    handleNavigation(); // Detecta el cambio en la URL antes de renderizar
  });

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
  {#if !hideTitle}
    <TitleBar title="Agregar {title}" base="Inventario" />
  {/if}

  <!-- Título dinámico -->
  <h2 class="text-center my-4">{title}</h2>

  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="form-group row {showFields ? '' : 'hidden'}">
              <label for="status" class="col-md-4 col-form-label">Estatus</label
              >
              <div class="col-md-4">
                <IncidentStatusListSelect
                  bind:value={values.status}
                  inlist={false}
                  required
                />
              </div>
            </div>

            <div class="form-group row {showFields ? '' : 'hidden'}">
              <label for="type" class="col-md-4 col-form-label"
                >Tipo de Reporte</label
              >
              <div class="col-md-4">
                <IncidentTypeListSelect
                  bind:value={values.type}
                  inlist={false}
                  required
                />
              </div>
            </div>
            {#if type != 0}
              <div class="form-group row">
                <label for="#select-branches" class="col-md-4 col-form-label"
                  >Estancia</label
                >
                <div class="col-md-8">
                  <BranchesSearchList bind:value={values.branches} />
                </div>
              </div>

              <div class="form-group row">
                <label for="#select-patients" class="col-md-4 col-form-label"
                  >Nombre del Paciente</label
                >
                <div class="col-md-8">
                  <PatientsSearchList
                    bind:value={values.patients}
                    filter={(row) => {
                      return row.branch == values.branches;
                    }}
                    onSelect={(patient) => {
                      if (patient != undefined) {
                        values.patientsNames = patient.name || "";
                        values.patients = patient.id || "";
                        values.room = patient.room || "";
                        // Si existen los datos, los asigna; si no, asigna string vacío
                        values.responsable = patient.responsible_name || "";
                        values.phone = patient.responsible_telephone || "";
                      }
                    }}
                  />
                </div>
              </div>

              <!-- hide next row, if type is 4 -->
              {#if type == 5 || values.type == 5}
                <div class="form-group row">
                  <label for="#select-workers" class="col-md-4 col-form-label"
                    >Trabajador</label
                  >
                  <div class="col-md-8">
                    <WorkersSearchList
                      bind:value={values.workers}
                      filter={(row) => {
                        return row.branches == values.branches;
                      }}
                      onSelect={(worker) => {
                        values.workerphone = worker.phone;
                      }}
                    />
                  </div>
                </div>

                <div class="form-group row">
                  <label for="position" class="col-md-4 col-form-label"
                    >Puesto</label
                  >
                  <div class="col-md-8">
                    <input
                      class="form-control"
                      type="text"
                      bind:value={values.position}
                      id="position"
                    />
                  </div>
                </div>

                <div class="form-group row">
                  <label for="workerphone" class="col-md-4 col-form-label"
                    >Teléfono de trabajador</label
                  >
                  <div class="col-md-8">
                    <input
                      class="form-control"
                      type="text"
                      bind:value={values.workerphone}
                      id="workerphone"
                    />
                  </div>
                </div>
              {/if}
            {:else}
              <div class="form-group row">
                <label for="#select-patients" class="col-md-4 col-form-label"
                  >Nombre del Paciente</label
                >
                <div class="col-md-8">
                  <input
                    class="form-control"
                    type="text"
                    bind:value={values.patientsNames}
                    id="other"
                  />
                </div>
              </div>

            {/if}
            
            <div class="form-group row">
              <label for="#select-patients" class="col-md-4 col-form-label"
                >Detalle de Incidencia</label
              >
              <!-- {#if type == 5}
                <div class="col-md-8">
                  <IncidentDetailListSelectPersonal bind:value={values.details} type={type} />
                </div>
              {:else if type == 4}
                <div class="col-md-8">
                  <IncidentDetailListSelectFamiliar bind:value={values.details} type={type} />
                </div>
              {:else}
                <div class="col-md-8">
                  <IncidentDetailListSelectPatient bind:value={values.details} type={type} />
                </div>
              {/if} -->
              <div class="col-md-8">
                <IncidentDetailListSelect bind:value={values.details} type={type} />
              </div>
            </div>

            {#if values.details == 13}
              <div class="form-group row">
                <label for="other" class="col-md-4 col-form-label">Otro</label
                >
                <div class="col-md-8">
                  <input
                    class="form-control"
                    type="text"
                    bind:value={values.other}
                    id="other"
                  />
                </div>
              </div>
            {/if}

            {#if type != 5}
              <div class="form-group row">
                <label for="responsable" class="col-md-4 col-form-label"
                  >Familiar Responsable</label
                >
                <div class="col-md-8">
                  <input
                    class="form-control"
                    type="text"
                    bind:value={values.responsable}
                    id="responsable"
                  />
                </div>
              </div>

              <div class="form-group row">
                <label for="phone" class="col-md-4 col-form-label"
                  >Teléfono de contacto</label
                >
                <div class="col-md-8">
                  <input
                    class="form-control"
                    type="text"
                    bind:value={values.phone}
                    id="phone"
                  />
                </div>
              </div>
            {/if}

            <div class="form-group row">
              <label for="subject" class="col-md-4 col-form-label">Razón</label>
              <div class="col-md-8">
                <textarea
                  class="form-control"
                  type="text"
                  bind:value={values.subject}
                  id="subject"
                ></textarea>
              </div>
            </div>

            <!-- hide next row, if type is 4 -->

            {#if values.other !== null && values.other !== undefined && values.other !== ""}
              <!-- Se muestra solo si values.other tiene un valor -->
              <div class="form-group row">
                <label for="reason" class="col-md-4 col-form-label"
                  >Motivo</label
                >
                <div class="col-md-8">
                  <textarea
                    class="form-control"
                    type="text"
                    bind:value={values.reason}
                    id="subject"
                  ></textarea>
                </div>
              </div>
            {/if}
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
            Guardar
          </button>
          <button
            on:click={cancel}
            class="btn btn-light waves-effect waves-light"
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .hidden {
    display: none;
  }
</style>
