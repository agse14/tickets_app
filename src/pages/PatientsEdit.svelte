<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser,permissions } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";

  import ListSelect from "../controls/ListSelect.svelte";
  import { options as PatientsBilling_periodList } from "../controls/PatientsBilling_periodListSelect";
  import BranchSearchList from "../controls/BranchSearchList.svelte";
  import PatientFormats from "../controls/PatientFormats.svelte";
  import ItemsOptions from "../controls/ItemsOptions.svelte";
  import { options as PatientsMedical_serviceList } from "../controls/PatientsMedical_serviceListSelect";
  import RoomSearchList from "../controls/RoomSearchList.svelte";
  import { options as PatientsStatusList } from "../controls/PatientsStatusListSelect";
  import { options as PatientsStaytypeList } from "../controls/PatientsStaytypeListSelect";
    import GenericListSelect from "../controls/GenericListSelect.svelte";

  function checkVisibles() {
    console.log("checkVisibles");
  }

  export let params = {};
  export let values = {status:3};
  export let autoAdd = false;
  export let buttons = true;
  export let onBack = () => {
    pop();
  };

  let old = {};
  let adder = {};
  let exists = false;
  let incidents = [];

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
      db.collection("patients")
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

            if (values.added != undefined) {
              let fecha = DateTime.fromJSDate(values.added.toDate()).toISODate();
              values.added = fecha;
            }
            
            old = query.data();
          }
          loading = false;
        });

      db.collection("incident").where("patients","==",tempId).get()
      .then(function (query){
        console.log(query);
        incidents = [];
        query.docs.forEach(element => {
          let tmp = element.data();
          tmp.id = element.id;
          incidents.push(tmp);
        });
        incidents = incidents;
        console.log("incidents",incidents);
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
    // Validación para cuarto asignado cuando el estatus es Activo
    // if (values.status == 0 && (!values.room || values.room === "")) {
    if (Number(values.status) === 0 && (!values.room || values.room === "" || values.room === null)) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Debe asignar un cuarto cuando el estatus del paciente es Activo.',
        confirmButtonText: 'Entendido'
      });
      return;
    } 

    if (checkVisibles != undefined) {
      checkVisibles();
    }
    loading = true;
    if (typeof values.added === "string" || values.added instanceof String) {
      values.added = DateTime.fromISO(values.added).startOf("day").toJSDate();
    }

    // --- REGISTROS HISTÓRICOS EN COLECCIÓN SEPARADA ---
    const historyPromises = [];

    // --- ACTUALIZACIÓN DE ESTADO DE CUARTOS EN COLECCIÓN ROOMS ---
    const roomUpdatePromises = [];

    // Verificar cambios en el cuarto asignado (incluyendo desocupación)
    if (old.room !== values.room) {
      
      // 🏠 LIBERAR CUARTO ANTERIOR: Marcarlo como disponible
      if (old.room && old.room !== "") {
        roomUpdatePromises.push(
          db.collection("room_inventory").doc(old.room).update({
            statusId: 1, // 1 = Disponible
            occupiedBy: null,
            occupiedByName: null,
            occupiedDate: null,
            lastUpdated: new Date(),
            updatedBy: $fbuser.uid
          })
        );

        const roomVacatedHistory = {
          patientId: tempId || null,
          patientName: values.name || "",
          roomId: old.room, // ← ID del cuarto que se desocupa
          type: "room_vacated",
          action: `Cuarto desocupado: ${old.room}`,
          details: {
            previousRoom: old.room,
            previousRoomId: old.room,
            newRoom: values.room || "",
            newRoomId: values.room || "",
            branch: values.branch || "",
            branchName: values.branchName || ""
          },
          date: new Date(),
          userId: $fbuser.uid,
          userName: $fbuser.displayName || ""
        };
        
        historyPromises.push(
          db.collection("rooms_history").add(roomVacatedHistory)
        );
      }

      // 🏠 OCUPAR CUARTO NUEVO: Marcarlo como ocupado
      if (values.room && values.room !== "") {
        roomUpdatePromises.push(
          db.collection("room_inventory").doc(values.room).update({
            statusId: 2, // 2 = Ocupado
            occupiedBy: tempId || null,
            occupiedByName: values.name || "",
            occupiedDate: new Date(),
            lastUpdated: new Date(),
            updatedBy: $fbuser.uid
          })
        );

        const roomHistory = {
          patientId: tempId || null,
          patientName: values.name || "",
          roomId: values.room, // ← ID del cuarto nuevo
          type: "room_assigned",
          action: `Cuarto asignado: ${values.room}`,
          details: {
            previousRoom: old.room || "",
            previousRoomId: old.room || "",
            newRoom: values.room,
            newRoomId: values.room,
            branch: values.branch || "",
            branchName: values.branchName || ""
          },
          date: new Date(),
          userId: $fbuser.uid,
          userName: $fbuser.displayName || ""
        };
        
        historyPromises.push(
          db.collection("rooms_history").add(roomHistory)
        );
      }
    }

    // Verificar cambios de estatus a 1 (Baja por defunción) o 2 (Baja voluntaria)
    if (old.status !== values.status && (values.status == 1 || values.status == 2)) {
      const statusText = values.status == 1 ? "Baja por defunción" : "Baja voluntaria";
      
      // 🏠 LIBERAR CUARTO POR BAJA: Marcarlo como disponible
      if (values.room && values.room !== "") {
        roomUpdatePromises.push(
          db.collection("room_inventory").doc(values.room).update({
            statusId: 1, // 1 = Disponible
            occupiedBy: null,
            occupiedByName: null,
            occupiedDate: null,
            dischargeDate: new Date(),
            dischargeReason: statusText,
            lastUpdated: new Date(),
            updatedBy: $fbuser.uid
          })
        );

        const roomVacatedByDischarge = {
          patientId: tempId || null,
          patientName: values.name || "",
          roomId: values.room, // ← ID del cuarto que se desocupa por baja
          type: "room_vacated_discharge",
          action: `Cuarto desocupado por baja: ${statusText}`,
          details: {
            previousRoom: values.room,
            previousRoomId: values.room,
            newRoom: "",
            newRoomId: "",
            branch: values.branch || "",
            branchName: values.branchName || "",
            dischargeReason: statusText
          },
          date: new Date(),
          userId: $fbuser.uid,
          userName: $fbuser.displayName || ""
        };
        
        historyPromises.push(
          db.collection("rooms_history").add(roomVacatedByDischarge)
        );
      }

      // Registro del cambio de estatus
      const statusHistory = {
        patientId: tempId || null,
        patientName: values.name || "",
        roomId: values.room || null, // ← Incluir roomId también aquí
        type: "status_change",
        action: `Estatus cambiado a: ${statusText}`,
        details: {
          previousStatus: old.status,
          newStatus: values.status,
          statusText: statusText
        },
        date: new Date(),
        userId: $fbuser.uid,
        userName: $fbuser.displayName || ""
      };
      
      historyPromises.push(
        db.collection("rooms_history").add(statusHistory)
      );
    }

    // Registro general de edición
    // const editHistory = {
    //   patientId: tempId || null,
    //   patientName: values.name || "",
    //   type: "edit",
    //   action: tempId ? "Paciente editado" : "Paciente creado",
    //   details: {
    //     changes: getChangedFields(old, values)
    //   },
    //   date: new Date(),
    //   userId: $fbuser.uid,
    //   userName: $fbuser.displayName || ""
    // };

    // historyPromises.push(
    //   db.collection("rooms_history").add(editHistory)
    // );
    // -----------------------------

    if (tempId == null) {
    //Crear nuevo si no tiene
      if (values.added == undefined) {
        values.added = timenow;
      }
      values.createdBy = $fbuser.uid;
      values.createdName = $fbuser.displayName ?? "";
      
      // 🏠 CASO ESPECIAL: Si es un paciente nuevo con cuarto asignado, ocupar el cuarto
      if (values.room && values.room !== "") {
        roomUpdatePromises.push(
          db.collection("room_inventory").doc(values.room).update({
            statusId: 2, // 2 = Ocupado
            occupiedBy: null, // Se actualizará después con el ID del documento
            occupiedByName: values.name || "",
            occupiedDate: new Date(),
            lastUpdated: new Date(),
            updatedBy: $fbuser.uid
          })
        );
      }
      
      db.collection("patients")
        .add(values)
        .then(function (docRef) {
          // Actualizar los historiales con el ID del paciente
          const updatePromises = historyPromises.map(promise => 
            promise.then(historyDoc => 
              historyDoc.update({ patientId: docRef.id })
            )
          );
          
          // 🏠 Actualizar el cuarto con el ID del paciente recién creado
          if (values.room && values.room !== "") {
            roomUpdatePromises.push(
              db.collection("room_inventory").doc(values.room).update({
                occupiedBy: docRef.id
              })
            );
          }
          
          // 🏠 Ejecutar actualizaciones de cuartos y historial en paralelo
          Promise.all([...updatePromises, ...roomUpdatePromises]).then(() => {
            loading = false;
            onBack();
          });
        });
    } else {
      // Actualizar paciente existente
      values.edited = firebase.firestore.FieldValue.serverTimestamp();
      values.editedBy = $fbuser.uid;
      values.editedByName = $fbuser.displayName ?? "";

      // 🏠 Guardar paciente, historial y actualizaciones de cuartos en paralelo
      const updatePromises = [
        db.collection("patients").doc(tempId).update(values),
        ...historyPromises,
        ...roomUpdatePromises
      ];

      Promise.all(updatePromises).then(() => {
        loading = false;
        onBack();
      });
    }
  }

  // Función auxiliar para detectar cambios
  function getChangedFields(oldData, newData) {
    const changes = {};
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    }
    return changes;
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

  function historyPayments(tempId) {
    window.location.href = "#/guest_paymentshistory/" + tempId + "/";
  }
</script>

<div class="page-content modal-body">
  <TitleBar title="Agregar Paciente" base="Inventario" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body" />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Huesped</h3>

            <div class="form-group row">
              <label for="name" class="col-md-4 col-form-label"
                >Nombre del huésped</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control name"
                  type="text"
                  bind:value={values.name}
                  id="name"
                  
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
              <label for="status" class="col-md-4 col-form-label">Estatus</label
              >
              <div class="col-md-4">
               
                {#if $permissions.admin || $permissions.accounting}
                  <ListSelect
                    options={PatientsStatusList}
                    bind:value={values.status}
                    inlist={false}
                    
                    required
                  />
                {:else}
                  <p>{PatientsStatusList[values.status]}</p>
                  <small style="">Favor de solicitar cambio de status en administración</small>
                {/if}
              </div>
            </div>
            <div class="form-group row">
              <label for="monthcost" class="col-md-4 col-form-label"
                >Costo mensual</label
              >
              <div class="col-md-8 input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input
                  class="form-control input-mask"
                  type="number"
                  bind:value={values.monthcost}
                  id="monthcost"
                />
              </div>
            </div>
            <div class="form-group row">
              <label for="introcost" class="col-md-4 col-form-label"
                >Inscripción</label
              >
              <div class="col-md-8 input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text">$</span>
                </div>
                <input
                  class="form-control input-mask"
                  type="number"
                  bind:value={values.introcost}
                  id="introcost"
                />
              </div>
            </div>
            {#if values.introcost > 0}
            <div class="form-group row">
              <label for="intromode" class="col-md-4 col-form-label"
                >Forma de pago Inscripción</label
              >
              <div class="col-md-4">
                <GenericListSelect class="form-control"
                  options={["1 Pago", "50% inicial - 50% al mes", "0% Inicial - 3 mensualidades"]}
                  bind:value={values.intromode}
                  inlist={false}
                   />
              </div>
            </div>
              {#if values.intropaid > 0}
              <div class="form-group row">
                <label for="intropaid" class="col-md-4 col-form-label"
                  >Pagado de Inscripción</label
                >
                <div class="col-md-8 input-group">
                  <div class="input-group-prepend">
                    <span class="input-group-text">$</span>
                  </div>
                  <input
                    class="form-control input-mask"
                    type="number"
                    readonly
                    value={values.intropaid}
                    id="intropaid"
                  />
                </div>
              </div>
              {/if}

            {/if}
            {#if values.separationpaid > 0}
              <div class="form-group row">
                <label for="intropaid" class="col-md-4 col-form-label"
                  >Pagado de Separación</label
                >
                <div class="col-md-8 input-group">
                  <div class="input-group-prepend">
                    <span class="input-group-text">$</span>
                  </div>
                  <input
                    class="form-control input-mask"
                    type="number"
                    readonly
                    value={values.separationpaid}
                    id="intropaid"
                  />
                </div>
              </div>
              {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Datos Generales</h3>

            <div class="form-group row">
              <label for="address" class="col-md-4 col-form-label"
                >Dirección</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control address"
                  type="text"
                  bind:value={values.address}
                  id="address"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="medical_service" class="col-md-4 col-form-label"
                >Servicio Médico</label
              >
              <div class="col-md-4">
                <ListSelect
                  options={PatientsMedical_serviceList}
                  bind:value={values.medical_service}
                  inlist={false}
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="medical_number" class="col-md-4 col-form-label"
                >Número</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.medical_number}
                  id="medical_number"
                />
              </div>
            </div>

            {#if values.separacion != undefined}
            <div class="form-group row">
              <label for="separacion" class="col-md-4 col-form-label"
                >Fecha de separación</label
              >
              <div class="col-md-8">
                <input
                  class="form-control"
                  type="date"
                  readonly
                  bind:value={values.separacion}
                  id="separacion"
                />
              </div>
            </div>
            {/if}
            {#if values.entrydate != undefined}
            <div class="form-group row">
              <label for="entrydate" class="col-md-4 col-form-label"
                >Fecha de ingreso</label
              >
              <div class="col-md-8">
                <input
                  class="form-control"
                  type="date"
                  bind:value={values.entrydate}
                  id="entrydate"
                  readonly
                  required
                />
              </div>
            </div>
            {/if}
            {#if values.status == 1 || values.status == 2}
            <div class="form-group row">
              <label for="dischargedate" class="col-md-4 col-form-label"
                >Fecha de baja</label
              >
              <div class="col-md-8">
                <input
                  class="form-control"
                  type="date"
                  bind:value={values.dischargedate}
                  id="dischargedate"
                  
                />
              </div>
            </div>
            {/if}
            <div class="form-group row">
              <label for="staytype" class="col-md-4 col-form-label"
                >Tipo de estancia</label
              >
              <div class="col-md-4">
                <ListSelect
                  options={PatientsStaytypeList}
                  bind:value={values.staytype}
                  inlist={false}
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="#select-room" class="col-md-4 col-form-label"
                >Cuarto Asignado</label
              >
              <div class="col-md-8">
                <RoomSearchList
                  bind:value={values.room}
                  filter={(row) => {
                    // Permitir cuartos disponibles O el cuarto actualmente asignado al paciente
                    return row.branches == values.branch && 
                          (row.statusId == 1 || row.id == values.room);
                  }}
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="nickname" class="col-md-4 col-form-label"
                >Sobrenombre</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control nickname"
                  type="text"
                  bind:value={values.nickname}
                  id="nickname"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="telephone" class="col-md-4 col-form-label"
                >Teléfono</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.telephone}
                  id="telephone"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="emme" class="col-md-4 col-form-label"
                >Num Socio EMME</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.emme}
                  id="emme"
                />
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Información de pagos</h3>

            <div class="form-group row">
              <label for="billing_period" class="col-md-4 col-form-label"
                >Periodo de cobro:</label
              >
              <div class="col-md-4">
                <ListSelect
                  options={PatientsBilling_periodList}
                  bind:value={values.billing_period}
                  inlist={false}
                  
                  required
                />
              </div>
            </div>

            <div class="custom-control custom-switch mb-2" dir="ltr">
              <input
                type="checkbox"
                class="custom-control-input"
                id="ivaSwitch"
                bind:checked={values.iva}
              />
              <label class="custom-control-label" for="ivaSwitch"
                >Impuestos</label
              >
            </div>

            
            <!-- IF is admin or cobranza -->
             {#if $permissions.admin || $permissions.accounting}
            <div class="form-group row">
              <label for="registrydate" class="col-md-4 col-form-label"
                >Fecha de inicio de Pagos</label
              >
              <div class="col-md-8">
                <input
                  class="form-control"
                  type="date"
                  bind:value={values.added}
                  id="registrydate"
                  readonly={$permissions.admin && $permissions.accounting}
                  
                />
              </div>
            </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Contacto Responsable (Pago)</h3>

            <div class="form-group row">
              <label for="responsible_name" class="col-md-4 col-form-label"
                >Nombre</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control responsible_name"
                  type="text"
                  bind:value={values.responsible_name}
                  id="responsible_name"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="responsible_address" class="col-md-4 col-form-label"
                >Dirección</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control responsible_address"
                  type="text"
                  bind:value={values.responsible_address}
                  id="responsible_address"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="responsible_email" class="col-md-4 col-form-label"
                >Correo electrónico</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control responsible_email"
                  type="text"
                  bind:value={values.responsible_email}
                  id="responsible_email"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label
                for="responsible_relationship"
                class="col-md-4 col-form-label">Parentesco</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control responsible_relationship"
                  type="text"
                  bind:value={values.responsible_relationship}
                  id="responsible_relationship"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="responsible_telephone" class="col-md-4 col-form-label"
                >Teléfono</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.responsible_telephone}
                  id="responsible_telephone"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="responsible_mobile" class="col-md-4 col-form-label"
                >Celular</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.responsible_mobile}
                  id="responsible_mobile"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="rfc" class="col-md-4 col-form-label">RFC</label>
              <div class="col-md-8 input-group">
                <input
                  class="form-control rfc"
                  type="text"
                  bind:value={values.rfc}
                  id="rfc"
                  
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="insurance" class="col-md-4 col-form-label"
                >Número de Seguro</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control insurance"
                  type="text"
                  bind:value={values.insurance}
                  id="insurance"
                  
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="curp" class="col-md-4 col-form-label">Curp</label>
              <div class="col-md-8 input-group">
                <input
                  class="form-control curp"
                  type="text"
                  bind:value={values.curp}
                  id="curp"
                  
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Contacto Familiar</h3>

            <div class="form-group row">
              <label for="family_name1" class="col-md-4 col-form-label"
                >Nombre</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_name1"
                  type="text"
                  bind:value={values.family_name1}
                  id="family_name1"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_address1" class="col-md-4 col-form-label"
                >Dirección</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_address1"
                  type="text"
                  bind:value={values.family_address1}
                  id="family_address1"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_email1" class="col-md-4 col-form-label"
                >Correo electrónico</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_email1"
                  type="text"
                  bind:value={values.family_email1}
                  id="family_email1"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_relationship1" class="col-md-4 col-form-label"
                >Parentesco</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_relationship1"
                  type="text"
                  bind:value={values.family_relationship1}
                  id="family_relationship1"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_telephone1" class="col-md-4 col-form-label"
                >Teléfono</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.family_telephone1}
                  id="family_telephone1"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_mobile1" class="col-md-4 col-form-label"
                >Celular</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.family_mobile1}
                  id="family_mobile1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Contacto Familiar</h3>

            <div class="form-group row">
              <label for="family_name2" class="col-md-4 col-form-label"
                >Nombre</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_name2"
                  type="text"
                  bind:value={values.family_name2}
                  id="family_name2"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_address2" class="col-md-4 col-form-label"
                >Dirección</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_address2"
                  type="text"
                  bind:value={values.family_address2}
                  id="family_address2"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_email2" class="col-md-4 col-form-label"
                >Correo electrónico</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_email2"
                  type="text"
                  bind:value={values.family_email2}
                  id="family_email2"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_relationship2" class="col-md-4 col-form-label"
                >Parentesco</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control family_relationship2"
                  type="text"
                  bind:value={values.family_relationship2}
                  id="family_relationship2"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_telephone2" class="col-md-4 col-form-label"
                >Teléfono</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.family_telephone2}
                  id="family_telephone2"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="family_mobile2" class="col-md-4 col-form-label"
                >Celular</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control"
                  type="number"
                  bind:value={values.family_mobile2}
                  id="family_mobile2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Hábitos y Costumbres</h3>

            <div class="form-group row">
              <label for="sleep" class="col-md-4 col-form-label">Dormir</label>
              <div class="col-md-8 input-group">
                <input
                  class="form-control sleep"
                  type="text"
                  bind:value={values.sleep}
                  id="sleep"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="restroom" class="col-md-4 col-form-label"
                >Baño (Horarios)</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control restroom"
                  type="text"
                  bind:value={values.restroom}
                  id="restroom"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="diaper" class="col-md-4 col-form-label"
                >Pañal (Horarios)</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control diaper"
                  type="text"
                  bind:value={values.diaper}
                  id="diaper"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="food_allowed" class="col-md-4 col-form-label"
                >Alimentos permitidos</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control food_allowed"
                  type="text"
                  bind:value={values.food_allowed}
                  id="food_allowed"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="food_not_allowed" class="col-md-4 col-form-label"
                >Alimentos no permitidos</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control food_not_allowed"
                  type="text"
                  bind:value={values.food_not_allowed}
                  id="food_not_allowed"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="food_allergies" class="col-md-4 col-form-label"
                >Alergias a alimentos</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control food_allergies"
                  type="text"
                  bind:value={values.food_allergies}
                  id="food_allergies"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="meds_allergies" class="col-md-4 col-form-label"
                >Alergias a medicamentos</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control meds_allergies"
                  type="text"
                  bind:value={values.meds_allergies}
                  id="meds_allergies"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="character" class="col-md-4 col-form-label"
                >Manías y Carácter</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control character"
                  type="text"
                  bind:value={values.character}
                  id="character"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="devices" class="col-md-4 col-form-label"
                >Placas, aparatos auditivos o prótesis</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control devices"
                  type="text"
                  bind:value={values.devices}
                  id="devices"
                  
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="general_comments" class="col-md-4 col-form-label"
                >Observaciones generales</label
              >
              <div class="col-md-8 input-group">
                <input
                  class="form-control general_comments"
                  type="text"
                  bind:value={values.general_comments}
                  id="general_comments"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Artículos Personales</h3>

            <div class="form-group row">
              <div class="col-md-4 col-form-label">Artículos</div>
              <div class="col-md-8">
                <ItemsOptions bind:value={values.items} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Comentarios adicionales o de relevancia.</h3>

            <div class="form-group row">
              <label for="additional_comments" class="col-md-4 col-form-label"
                >Comentarios</label
              >
              <div class="col-md-8 input-group">
                <textarea
                  class="form-control additional_comments"
                  bind:value={values.additional_comments}
                  id="additional_comments"
                />
              </div>
            </div>

            {#if values.status != 0}
              <h3>Consultar Historial de Pagos.</h3>
              <div class="col-md-4 col-form-label">
                  <button
                    on:click={() =>
                        historyPayments(values.id)}
                    class="btn btn-light waves-effect">
                    Historial de Pagos
                  </button>
              </div>
            {/if}

            <div class="form-group row">
              <div class="col-12">
                <PatientFormats
                  on:change={(event) => {
                    setField("formats", event.detail.value);
                  }}
                  bind:data={values}
                  inlist={false}
                  on:action={onAction}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Incidentes Reportados</h3>
            <ul>
              {#each incidents as incident}
                <li><a href="#/editincident/{incident.id}"> {incident.subject}</a>: {#if incident.status == 0} En proceso{:else} Resuelto {/if}</li>
              {/each}
            </ul>
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
