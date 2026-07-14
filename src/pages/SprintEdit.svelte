<script>
  import { pop } from "svelte-spa-router";
  import { fbuser, permissions } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import ListSelect from "../controls/ListSelect.svelte";
  import { onMount } from "svelte";

  export let params = {};
  export let values = { statusIndex: 0 }; // Default values
  export let buttons = true;
  export let onBack = () => {
    pop();
  };

  let old = {};
  let exists = false;
  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;

  const tempId = params.bid;

  // Status options for sprints
  const statusOptions = [
    "Planificado",
    "Activo",
    "Completado"
  ];

  if (filterName != undefined && filterValue != undefined) {
    values[filterName] = filterValue;
  }
  if (params.wild != undefined && params.wild != "") {
    let parray = params.wild.split("/");
    for (let p = 0; p < parray.length; p++) {
      const element = parray[p];
      if (p % 2 == 0 && parray[p + 1] != undefined && parray[p + 1] != "") {
        values[element] = parray[p + 1];
      }
    }
  }

  onMount(() => {
    form = document.getElementById("form");

    if (tempId == null) {
      // For new sprints
      loading = false;
    } else {
      db.collection("sprints")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || !query.exists || query.data() == null) {
            // No data
            loading = false;
            Swal.fire({
              icon: 'warning',
              title: 'Sprint no encontrado',
              text: 'El sprint solicitado no existe.',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              onBack();
            });
          } else {
            exists = true;
            const sprintData = query.data();
            values.id = query.id;

            // Assign fields individually to preserve bindings
            values.name = sprintData.name;
            values.description = sprintData.description;
            values.startDate = sprintData.startDate ? (sprintData.startDate.toDate ? sprintData.startDate.toDate().toISOString().split('T')[0] : new Date(sprintData.startDate).toISOString().split('T')[0]) : '';
            values.endDate = sprintData.endDate ? (sprintData.endDate.toDate ? sprintData.endDate.toDate().toISOString().split('T')[0] : new Date(sprintData.endDate).toISOString().split('T')[0]) : '';
            values.status = sprintData.status;
            values.createdDate = sprintData.createdDate;
            values.createdBy = sprintData.createdBy;
            values.createdByName = sprintData.createdByName;
            values.lastUpdated = sprintData.lastUpdated;
            values.lastUpdatedBy = sprintData.lastUpdatedBy;
            values.lastUpdatedByName = sprintData.lastUpdatedByName;

            // Ensure status has a default value
            if (!values.status) {
              values.status = 'planned';
            }

            // Convert status to index for ListSelect, default to 0 if not found
            values.statusIndex = Math.max(0, ['planned', 'active', 'completed'].indexOf(values.status));

            // Ownership check: if not admin/support, check if user created it
            if (!$permissions.admin && !$permissions.support) {
              if ($fbuser && values.createdBy && $fbuser.uid !== values.createdBy) {
                // Not allowed to edit this sprint
                Swal.fire({
                  icon: 'warning',
                  title: 'Acceso denegado',
                  text: 'No tiene permisos para editar este sprint.',
                  confirmButtonText: 'Aceptar'
                }).then(() => {
                  onBack();
                });
                return;
              }
            }

            old = sprintData;
          }
          loading = false;
        })
        .catch((error) => {
          console.error('Error loading sprint:', error);
          loading = false;
          Swal.fire({
            title: "Error",
            text: "Error al cargar el sprint: " + error.message,
            type: "error",
            confirmButtonColor: "#f46a6a",
          }).then(() => {
            onBack();
          });
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

    // Validate required fields
    if (!values.name || values.name.trim() === "") {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del sprint es obligatorio.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!values.startDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'La fecha de inicio es obligatoria.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!values.endDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'La fecha de fin es obligatoria.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (new Date(values.startDate) >= new Date(values.endDate)) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas inválidas',
        text: 'La fecha de fin debe ser posterior a la fecha de inicio.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    loading = true;

    if (tempId == null) {
      // Create new sprint
      const sprintData = {
        name: values.name,
        startDate: new Date(values.startDate + 'T00:00:00'), // Convert to local Date object
        endDate: new Date(values.endDate + 'T00:00:00'), // Convert to local Date object
        status: ['planned', 'active', 'completed'][values.statusIndex] || 'planned',
        createdDate: new Date(),
        createdBy: $fbuser.uid,
        createdByName: $fbuser.displayName || $fbuser.email || "Usuario"
      };

      // Only add description if it has a value
      if (values.description && values.description.trim() !== "") {
        sprintData.description = values.description;
      }

      db.collection("sprints")
        .add(sprintData)
        .then(() => {
          loading = false;
          onBack();
        })
        .catch((error) => {
          loading = false;
          Swal.fire({
            title: "Error",
            text: "Error al crear el sprint: " + error.message,
            type: "error",
            confirmButtonColor: "#f46a6a",
          });
        });
    } else {
      // Update existing sprint
      const sprintData = {
        name: values.name,
        startDate: new Date(values.startDate + 'T00:00:00'), // Convert to local Date object
        endDate: new Date(values.endDate + 'T00:00:00'), // Convert to local Date object
        status: ['planned', 'active', 'completed'][values.statusIndex] || 'planned',
        lastUpdated: new Date(),
        lastUpdatedBy: $fbuser.uid,
        lastUpdatedByName: $fbuser.displayName || $fbuser.email || "Usuario"
      };

      // Only add description if it has a value
      if (values.description && values.description.trim() !== "") {
        sprintData.description = values.description;
      }

      db.collection("sprints")
        .doc(tempId)
        .update(sprintData)
        .then(() => {
          loading = false;
          onBack();
        })
        .catch((error) => {
          loading = false;
          Swal.fire({
            title: "Error",
            text: "Error al actualizar el sprint: " + error.message,
            type: "error",
            confirmButtonColor: "#f46a6a",
          });
        });
    }
  }

  function setField(field, value) {
    values[field] = value;
    values = values;
  }
</script>

<div class="page-content modal-body">
  <TitleBar title={tempId ? "Editar Sprint" : "Crear Sprint"} base="Administración" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">
              {#if tempId}
                Sprint #{values.name || tempId}
              {:else}
                Nuevo Sprint
              {/if}
            </h4>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Información del Sprint</h3>

            <div class="form-group row">
              <label for="name" class="col-md-3 col-form-label">Nombre *</label>
              <div class="col-md-9 input-group">
                <input
                  type="text"
                  class="form-control"
                  id="name"
                  bind:value={values.name}
                  required
                  placeholder="Nombre descriptivo del sprint"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="description" class="col-md-3 col-form-label">Descripción</label>
              <div class="col-md-9">
                <textarea
                  class="form-control"
                  id="description"
                  rows="3"
                  bind:value={values.description}
                  placeholder="Descripción opcional del sprint"
                ></textarea>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="form-group row">
                  <label for="startDate" class="col-md-6 col-form-label">Fecha Inicio *</label>
                  <div class="col-md-6">
                    <input
                      type="date"
                      class="form-control"
                      id="startDate"
                      bind:value={values.startDate}
                      required
                    />
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group row">
                  <label for="endDate" class="col-md-6 col-form-label">Fecha Fin *</label>
                  <div class="col-md-6">
                    <input
                      type="date"
                      class="form-control"
                      id="endDate"
                      bind:value={values.endDate}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group row">
              <label for="status" class="col-md-3 col-form-label">Estado</label>
              <div class="col-md-4">
                <ListSelect
                  options={statusOptions}
                  bind:value={values.statusIndex}
                  inlist={false}
                  required
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    {#if tempId && exists}
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Información del Sprint</h3>

            <div class="form-group row">
              <div class="col-md-3 col-form-label">Creado por:</div>
              <div class="col-md-9 col-form-label">
                {values.createdByName || "Usuario desconocido"}
              </div>
            </div>

            <div class="form-group row">
              <div class="col-md-3 col-form-label">Fecha de creación:</div>
              <div class="col-md-9 col-form-label">
                {values.createdDate ? new Date(values.createdDate.toDate ? values.createdDate.toDate() : values.createdDate).toLocaleDateString('es-ES') : 'N/A'}
              </div>
            </div>

            {#if values.lastUpdated}
            <div class="form-group row">
              <div class="col-md-3 col-form-label">Última actualización:</div>
              <div class="col-md-9 col-form-label">
                {values.lastUpdated ? new Date(values.lastUpdated.toDate ? values.lastUpdated.toDate() : values.lastUpdated).toLocaleDateString('es-ES') : 'N/A'} por {values.lastUpdatedByName || "Usuario desconocido"}
              </div>
            </div>
            {/if}

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
            disabled={loading}
          >
            {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
            {tempId ? "Actualizar" : "Crear Sprint"}
          </button>
          {#if loading}
            <div class="spinner-grow text-secondary m-1" role="status">
              <span class="sr-only">Cargando...</span>
            </div>
          {/if}
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