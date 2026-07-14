<script>
  import TitleBar from "../TitleBar.svelte";
  import swal from "sweetalert";
  import { onMount, onDestroy } from "svelte";
  import PatientlogEdit from "./PatientlogEdit.svelte";
  import { paymentperiod, workers } from "../controls/workers.js";
  import { branches } from "../controls/branches.js";
  import { positions } from "../controls/positions.js";
  import { detail } from "../controls/patientlog.js";
    import { permissions } from "../stores";

  export let recibo = {};
  export let modal = true;

  let recibos_order = {};
  let recibos = [];
  let desgloses = [];
  let loading = false;
  let showModal = false;
  let filter = "All";
  let report = "1";
  let filterBranch = "All";
  let uniqueBranchNames = {};
  let editingIndex = null; // Mantiene el índice del registro que se está editando

  let editData = {};
  let deleteData = {};
  const today = DateTime.local().setLocale("es-mx").toISODate();

  let start = DateTime.local().startOf("month").toISODate();
  let end = DateTime.local().endOf("month").toISODate();
  let printdate = DateTime.local().toISODate();
  let query;
  let newend;
  let total_sem = 0;
  let total_quin = 0;
  let total_esp = 0;
  let total_mant = 0;
  let total_banca = 0;
  let total_proyecto = 0; // Nueva variable para totales de Proyecto
  let totalsByConcept = {}; // Nueva estructura para totales por concepto

  // $: start, end, filter, filterBranch, loadFireStore();
  $: if (start && end && filter && filterBranch !== undefined) {
  loadFireStore();
}

  function loadFireStore() {
    if (query != undefined) {
      query();
    }
    let newstart = DateTime.fromISO(start).toJSDate();
    newend = DateTime.fromISO(end).endOf("day").toJSDate();

    query = db
      .collection("patientlog")
      .where("added", ">=", newstart)
      .where("added", "<=", newend)
      .onSnapshot((result) => {
        recibos = {};
        total_quin = 0;
        total_sem = 0;
        total_esp = 0;
        total_mant = 0;
        total_banca = 0;
        total_proyecto = 0; // Reiniciar total de Proyecto
        var re = /-/g;
        var newTodayDate = today.replace(re, "");
        let folio = newTodayDate;
        let num = 1;
        if (!totalsByConcept || Object.keys(totalsByConcept).length === 0) {
          totalsByConcept = {};
        }
        // Limpiar totalsByConcept
        for (const concept in totalsByConcept) {
          if (totalsByConcept.hasOwnProperty(concept)) {
            totalsByConcept[concept] = { totalAmount: 0, totalUnits: 0 };
          }
        }
        result.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          let recibo = doc.data();
          recibo.id = doc.id;
          if (recibo.uid == "AYwKNc6ehi2nuV3CcLNd") {
            console.log("Alma , guardia", recibo.added.toDate(), recibo);
          }

          // forEach workers, si es recibo.uid == worker.id , recibo.userName = worker.name
          if (typeof recibo.amount !== "number") {
            recibo.amount = 0;
          }
          if (recibos[recibo.uid] == undefined) {
            recibos[recibo.uid] = {
              uid: recibo.uid,
              username: "",
              concepts: [],
              patientlog: [],
              total: 0,
              extra: [],
              totalunits: 0,
              extraunits: 0,
            };
            // console.log(workers, $workers);
            $workers.forEach((element) => {
              if (recibo.uid == element.id) {
                recibos[recibo.uid].id = element.id;
                recibos[recibo.uid].employee_number = element.folio;
                recibos[recibo.uid].username = element.name;
                recibos[recibo.uid].paymentperiod = element.paymentperiod;
                recibos[recibo.uid].payroll = element.payroll;
                recibos[recibo.uid].payamount = element.pay;
              }
            });
            recibos[recibo.uid].folio = folio + num.toString().padStart(3, "0");
            num++;
          }

          $branches.forEach((element) => {
            if (recibo.branch == element.id) {
              recibo.branchName = element.name;
              recibos[recibo.uid].branchName = element.name;
            }
            if (!uniqueBranchNames[element.name]) {
              // Si no existe, lo agregamos como una clave en el objeto con el mismo nombre
              uniqueBranchNames[element.name] = true;
            }
          });
          if (recibo.positions != undefined) {
            $positions.forEach((element) => {
              if (recibo.positions == element.id) {
                recibo.positionsName = element.name;
                recibos[recibo.uid].positionsName = element.name;
              }
            });
          }
          if (detail[recibo.detail] != undefined) {
            recibo.detailName = detail[recibo.detail];
          } else {
            // recibo.detailName = "Guardia";
            recibo.detailName = "Guardia" + (recibo.positionsName ? ` - ${recibo.positionsName}` : "");
          }
          let conceptName = recibo.detailName;
          let branchName = recibo.branchName;
          if (!totalsByConcept[conceptName]) {
            totalsByConcept[conceptName] = { totalAmount: 0, totalUnits: 0, branches: {} };
          }

          // Sumar totales globales del concepto
          totalsByConcept[conceptName].totalAmount += recibo.amount * recibo.units;
          totalsByConcept[conceptName].totalUnits += recibo.units;

          // Asegurarse de que `branches` existe
          if (!totalsByConcept[conceptName].branches) {
            totalsByConcept[conceptName].branches = {};
          }

          // Asegurarse de que `branchName` dentro de `branches` existe
          if (!totalsByConcept[conceptName].branches[branchName]) {
            totalsByConcept[conceptName].branches[branchName] = {
              totalAmount: 0,
              totalUnits: 0
            };
          }
          totalsByConcept[conceptName].branches[branchName].totalAmount += recibo.amount * recibo.units;
          totalsByConcept[conceptName].branches[branchName].totalUnits += recibo.units;

          //Condicion para crear monto a pagar dependiendo si se paga por Guardia o Sueldo Fijo
          if (recibos[recibo.uid].paymentperiod != "Especial") {
            if (recibos[recibo.uid].payroll == "Fijo") {
              // console.log("Sueldo Fijo No Especial");
              if (
                (recibos[recibo.uid].payamount != "" ||
                  recibos[recibo.uid].payamount != undefined) &&
                recibo.createdBy != "pending"
              ) {
                // console.log(recibo);
                recibos[recibo.uid].extra.push(recibo);
                // conceptos que se suman
                if (
                  [3, 6, 7, 8, 12, 13, 17, 18, 20, 21, 22, 23, 24, 26].includes(
                    recibo.detail,
                  )
                ) {
                  recibo.amount;
                } else {
                  //   //todos los demás se restan
                  if (recibo.type == 1) {
                    recibo.amount = -1 * recibo.amount;
                  }
                }
                recibos[recibo.uid].total += recibo.amount * recibo.units;
                recibos[recibo.uid].extraunits += recibo.units;
              }
            } else {
              // console.log("Sueldo Guardia No Especial");
              if (recibo.type == 0) {
                let hasConcept = false;
                let cId = 0;
                for (let c = 0; c < recibos[recibo.uid].concepts.length; c++) {
                  const element = recibos[recibo.uid].concepts[c];
                  if (
                    element.amount == recibo.amount &&
                    element.branch == recibo.branch &&
                    element.positions == recibo.positions
                  ) {
                    hasConcept = true;
                    cId = c;
                  }
                }
                if (hasConcept) {
                  recibos[recibo.uid].patientlog.push(recibo);
                  recibos[recibo.uid].concepts[cId].units += recibo.units;
                } else {
                  recibos[recibo.uid].patientlog.push(recibo);
                  recibos[recibo.uid].concepts.push(recibo);
                }
                // recibos[recibo.uid].patientlog.push(recibo);
                // Verificar si recibo.sharedShift existe y es un objeto antes de procesarlo
                if (typeof recibo.sharedShift === 'object' && recibo.sharedShift !== null) {
                  recibo.sharedWorkers = [];
                  // Solo toma el array del puesto actual
                  const sharedArray = recibo.sharedShift[recibo.positions];
                  if (Array.isArray(sharedArray)) {
                    sharedArray.forEach(sharedId => {
                      let sharedWorker = $workers.find(worker => worker.id === sharedId);
                      if (sharedWorker) {
                        recibo.sharedWorkers.push(sharedWorker.name);
                      } else {
                        recibo.sharedWorkers.push(sharedId);
                      }
                    });
                  }
                } else {
                  recibo.sharedWorkers = [];
                }
                recibos[recibo.uid].total += recibo.amount * recibo.units;
                recibos[recibo.uid].totalunits += recibo.units;
              } else {
                recibos[recibo.uid].extra.push(recibo);
                // Conceptos que se suman
                if (
                  [3, 6, 7, 8, 12, 13, 17, 18, 20, 21, 22, 23, 24, 26].includes(
                    recibo.detail,
                  )
                ) {
                  recibo.amount * recibo.units;
                } else {
                  // Todos los demás se restan
                  recibo.amount = -1 * recibo.amount;
                }
                recibos[recibo.uid].total += recibo.amount * recibo.units;
                recibos[recibo.uid].extraunits += recibo.units;
              }
            }
          } else {
            if (recibos[recibo.uid].payroll == "Fijo") {
              // console.log("Sueldo Fijo  Especial");
              if (
                (recibos[recibo.uid].payamount != "" ||
                  recibos[recibo.uid].payamount != undefined) &&
                recibo.createdBy != "pending"
              ) {
                // console.log(recibo);
                recibos[recibo.uid].extra.push(recibo);
                // conceptos que se suman
                if (
                  [3, 6, 7, 8, 12, 13, 17, 18, 20, 21, 22, 23, 24, 26].includes(
                    recibo.detail,
                  )
                ) {
                  recibo.amount;
                } else {
                  //   //todos los demás se restan
                  if (recibo.type == 1) {
                    recibo.amount = -1 * recibo.amount;
                  }
                }
                recibos[recibo.uid].total += recibo.amount * recibo.units;
                recibos[recibo.uid].extraunits += recibo.units;
              }
            } else {
              // console.log("Sueldo Guardia Especial");
              if (recibo.type == 0) {
                let hasConcept = false;
                let cId = 0;
                for (let c = 0; c < recibos[recibo.uid].concepts.length; c++) {
                  const element = recibos[recibo.uid].concepts[c];
                  if (
                    element.amount == recibo.amount &&
                    element.branch == recibo.branch &&
                    element.positions == recibo.positions
                  ) {
                    hasConcept = true;
                    cId = c;
                  }
                }
                if (hasConcept) {
                  recibos[recibo.uid].patientlog.push(recibo);
                  recibos[recibo.uid].concepts[cId].units += recibo.units;
                } else {
                  recibos[recibo.uid].patientlog.push(recibo);
                  recibos[recibo.uid].concepts.push(recibo);
                }
                // recibos[recibo.uid].patientlog.push(recibo);
                // Verificar si recibo.sharedShift existe y es un objeto antes de procesarlo
                if (typeof recibo.sharedShift === 'object' && recibo.sharedShift !== null) {
                  recibo.sharedWorkers = [];
                  const sharedArray = recibo.sharedShift[recibo.positions];
                  if (Array.isArray(sharedArray)) {
                    sharedArray.forEach(sharedId => {
                      let sharedWorker = $workers.find(worker => worker.id === sharedId);
                      if (sharedWorker) {
                        recibo.sharedWorkers.push(sharedWorker.name);
                      } else {
                        recibo.sharedWorkers.push(sharedId);
                      }
                    });
                  }
                } else {
                  recibo.sharedWorkers = [];
                }
                recibos[recibo.uid].total += recibo.amount * recibo.units;
                recibos[recibo.uid].totalunits += recibo.units;
              } else {
                recibos[recibo.uid].extra.push(recibo);
                // conceptos que se suman
                if (
                  [3, 6, 7, 8, 12, 13, 17, 18, 20, 21, 22, 23, 24, 26].includes(
                    recibo.detail,
                  )
                ) {
                  recibo.amount * recibo.units;
                } else {
                  //todos los demás se restan
                  recibo.amount = -1 * recibo.amount;
                }
                recibos[recibo.uid].total += recibo.amount * recibo.units;
                recibos[recibo.uid].extraunits += recibo.units;
              }
            }
          }
        });
        // console.log(recibos);

        let rids = Object.keys(recibos);
        for (let r = 0; r < rids.length; r++) {
          const rid = rids[r];
          // if (recibos[rid].total >= 0) {
          if (recibos[rid].paymentperiod != "Especial") {
            if (recibos[rid].payroll == "Fijo") {
              var obj = recibos[rid];
              obj.total += obj.payamount / 2;
            }

            if (recibos[rid].total >= "0") {
              if (recibos[rid].paymentperiod == "Semanal") {
                total_sem += recibos[rid].total;
              } else {
                // if (recibos[rid].total >= '0') {
                if (recibos[rid].paymentperiod == "Quincenal") {
                  total_quin += recibos[rid].total;
                }
                if (recibos[rid].paymentperiod == "Mantenimiento") {
                  total_mant += recibos[rid].total;
                }
                if (recibos[rid].paymentperiod == "Banca") {
                  total_banca += recibos[rid].total;
                }
                if (recibos[rid].paymentperiod == "Proyecto") {
                  total_proyecto += recibos[rid].total;
                }
              }
            }
          } else {
            total_esp += recibos[rid].total;
          }
        }
        //Vaciamos los datos de Recibos en un array y ordenamos por alfabeto
        recibos_order = {};
        recibos_order = Object.values(recibos).sort(function (a, b) {
          var nameA = a.username.toUpperCase(); // ignore upper and lowercase
          var nameB = b.username.toUpperCase();
          if (nameA < nameB) {
            return -1;
          } else if (nameA > nameB) {
            return 1;
          } else return 0;
        }, {});

        // Mostrar los totales por concepto
        // for (let concept in totalsByConcept) {
        //   console.log(`Concepto: ${concept}`);
        //   console.log(
        //     `  Total Amount: ${totalsByConcept[concept].totalAmount}`,
        //   );
        //   console.log(`  Total Units: ${totalsByConcept[concept].totalUnits}`);
        // }
      });
  }

  $: totalBranchAmount = 0;

  $: if (filterBranch !== "All") {
    totalBranchAmount = Object.values(totalsByConcept)
      .map(c => c?.branches?.[filterBranch]?.totalAmount || 0)
      .reduce((a, b) => a + b, 0);
  } else {
    totalBranchAmount = total_sem + total_quin + total_esp + total_mant + total_banca + total_proyecto;
  }

  function exportTableToCSV(filename) {
    var csv = [];
    var rows = document.querySelectorAll("table tr");

    for (var i = 0; i < rows.length; i++) {
      var row = [],
        cols = rows[i].querySelectorAll("td, th");

      for (var j = 0; j < cols.length; j++) row.push(cols[j].innerText);

      csv.push('"' + row.join('","') + '"');
    }

    // Download CSV file
    downloadCSV(csv.join("\n"), filename);
  }

  function downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;

    // CSV file
    csvFile = new Blob([csv], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Download link
    downloadLink = document.createElement("a");

    // File name
    downloadLink.download = filename;

    // Create a link to the file
    downloadLink.href = window.URL.createObjectURL(csvFile);

    // Hide download link
    downloadLink.style.display = "none";

    // Add the link to DOM
    document.body.appendChild(downloadLink);

    // Click download link
    downloadLink.click();
  }

  function setEditId(eId) {
    console.log("Agregando concepto", eId);
    editData = { uid: eId, type: 1, added: newend, positionsName: " " };
    showModal = true;
    jQuery("#editModalScrollable").modal("show");
  }

  function selDeleteId(eId) {
    console.log("Buscando eId:", eId);
    
    if (!recibos || !recibos[eId]) {
      console.error("No se encontró el recibo con ID:", eId);
      return;
    }
    
    deleteData = recibos[eId];
    
    // Combina patientlog y extra en un solo array para mostrar todos los registros
    const allRecords = [
      ...(deleteData.patientlog || []),
      ...(deleteData.extra || [])
    ];
    
    // Crea un array combinado para mostrar en el modal
    deleteData.allRecords = allRecords;
    
    console.log("deleteData:", deleteData);
    console.log("Total records:", allRecords.length);
    
    showModal = true;
    jQuery("#DeleteModalScrollable").modal("show");
  }

  function deleteDoc(id) {
    Swal.fire({
      title: "¿Esta seguro?",
      text: "Desea eliminar este registro",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Si, borrarlo!",
    }).then(function (result) {
      if (result.value) {
        jQuery("#DeleteModalScrollable").modal("hide");
        db.collection("patientlog").doc(id).delete();
        //Swal.fire("Deleted!", "Your file has been deleted.", "success");
      }
    });
  }

  function updateAmount(id, newAmount) {
    console.log(id, newAmount);
    Swal.fire({
      title: "¿Está seguro?",
      text: `Desea actualizar el monto de esta guardia a ${newAmount}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Sí, actualizar",
    }).then(function (result) {
      if (result) {
        // Oculta el modal si es necesario
        jQuery("#DeleteModalScrollable").modal("hide");

        // Actualiza el registro en la colección 'patientlog' con el nuevo amount
        db.collection("patientlog")
          .doc(id)
          .update({
            amount: newAmount,
          })
          .then(() => {
            Swal.fire("Actualizado!", "El monto ha sido actualizado.", "success");
          })
          .catch((error) => {
            console.error("Error actualizando el registro: ", error);
            Swal.fire("Error!", "Hubo un problema al actualizar el registro.", "error");
          });
      }
    });
  }

  // Se invoca esta función cuando se guarda el valor editado
  function saveAmount(index,amount) {
    console.log(index, amount);
    const recibo = deleteData.patientlog[index];
    updateAmount(index, amount);
    editingIndex = null; // Finaliza el modo de edición
  }

  function changePayments(current, name) {
    swal({
      title: "Cambiar pago",
      content: "input",
      showCancelButton: true,
      buttons: ["Cancelar", "Modificar"],
      showLoaderOnConfirm: true,
      confirmButtonColor: "#3b5de7",
      cancelButtonColor: "#f46a6a",
      preConfirm: function (name) {},
      allowOutsideClick: false,
    }).then(function (name) {
      console.log(name);
      if (name != null) {
        var values = {
          name: name,
        };

        // db.collection("branches")
        //   .add(values)
        addBranches(values).then((rid) => {
          value = rid;
          swal({
            icon: "success",
            title: "Registro guardado!",
            html: "Se agregó correctamente ", // + name.value
          });
        });
      }
    });
  }
</script>

<div class="page-content">
  <TitleBar title="Reporte de Nómina" base="Dashboard" />
  <div class="row input-group">
    <div class="col-12 no-print">
      <label>Fechas</label>
    </div>
    <div class="col-6">
      <div class="form-group mb-0 no-print">
        Desde<br />
        <input
          type="date"
          class="form-control"
          id="start"
          name="start"
          bind:value={start}
        />
      </div>
    </div>
    <div class="col-6 no-print">
      Hasta<br />
      <input
        type="date"
        class="form-control"
        name="end"
        id="end"
        bind:value={end}
      />
    </div>

    <div class="col-6 no-print">
      Fecha de recibo<br />
      <input
        type="date"
        class="form-control"
        name="printdate"
        id="printdate"
        bind:value={printdate}
      />
    </div>
    <!-- <div class="form-group row no print">  -->
    <div class="col-6 no-print">
      Tipo de pago<br />
      <!-- <label for="type" class="col-md-6 col-form-label">Tipo de pago</label>  -->
      <select class="custom-select" bind:value={filter}>
        <option value="All">Todos</option>
        <option value="Semanal">Semanal</option>
        <option value="Quincenal">Quincenal</option>
        <option value="Especial">Especial</option>
        <option value="Mantenimiento">Mantenimiento</option>
        <option value="Banca">Banca</option>
        <option value="Proyecto">Proyecto</option> <!-- Nueva opción -->
      </select>
    </div>
    <div class="col-6 no-print">
      Tipo de Reporte<br />
      <!-- <label for="type" class="col-md-6 col-form-label">Tipo de pago</label>  -->
      <select class="custom-select" bind:value={report}>
        <option value="1">Recibos de Nómina</option>
        <option value="2">Totales de Nómina</option>
        <option value="3">Totales de Nómina (Por Concepto)</option>
        <!-- <option value="3">Reporte de Nómina</option> -->
      </select>
    </div>
    <div class="col-6 no-print">
      Sucursal<br />
      <select class="custom-select" bind:value={filterBranch}>
        <option value="All">Todas</option>
        {#each Object.keys(uniqueBranchNames) as branchName}
          <option value={branchName}>{branchName}</option>
        {/each}
      </select>
    </div>
    <br />
    <!-- </div> -->
  </div>
</div>
<div class="row">
  <div class="col-12">
    <div class="card">
      <div class="card-body">
        <div class="row">
          <div class="col-6">
            <button
              on:click={() => window.print()}
              class="btn btn-print waves-effect waves-light no-print"
            >
              <i class="bx bx-printer font-size-16 align-middle mr-2">
              </i>Imprimir
            </button>

            <button
              on:click={() => {
                exportTableToCSV("tabla.csv");
              }}
              class="btn btn-print waves-effect waves-light no-print"
            >
              Descargar CSV
            </button>
          </div>
          {#if filterBranch === "All"}
            <div class="col-6">
              Total de nomina: {filter == "All"
                ? Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  }).format(
                    total_sem + total_quin + total_esp + total_mant + total_banca + total_proyecto,
                  )
                : filter == "Semanal"
                  ? Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    }).format(total_sem.toFixed(2))
                  : filter == "Quincenal"
                    ? Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(total_quin.toFixed(2))
                    : filter == "Mantenimiento"
                      ? Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        }).format(total_mant.toFixed(2))
                      : filter == "Banca"
                        ? Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(total_banca.toFixed(2))
                          : filter == "Proyecto"
                          ? Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(total_proyecto.toFixed(2)) // Mostrar total de Proyecto
                            : Intl.NumberFormat("es-MX", {
                                style: "currency",
                                currency: "MXN",
                              }).format(total_esp.toFixed(2))}
            </div>
          {/if}
        </div>

        {#if report == "1"}
          {#each Object.keys(recibos_order) as arreglo}
            {#if filterBranch == "All" || filterBranch == recibos_order[arreglo].branchName}
              {#if filter == "All" || filter == recibos_order[arreglo].paymentperiod}
                {#if recibos_order[arreglo].payroll == "Fijo"}
                  <table
                    id="table"
                    class="table table-striped print-no-break mb-4 mt-4"
                  >
                    <thead>
                      <tr>
                        <th>
                          Personal #: <b>{recibos_order[arreglo].employee_number}
                          <!-- <img src="assets/images/logoprint.png" alt="logo"> -->
                        </th>
                        <th style="font-size:20px"><b>RECIBO</b></th>
                        <th>FOLIO: {recibos_order[arreglo].folio}</th>
                        <th>FECHA: {printdate}</th>
                      </tr>
                      <tr>
                        <th
                          >Personal: <b>{recibos_order[arreglo].username}</b
                          ></th
                        >
                        <th style="text-align: center;">CANTIDAD</th>
                        <th>PRECIO</th>
                        <th>IMPORTE</th>
                        <th class="no-print">Acciones</th>
                        <th class="no-print" style="text-align: center; max-width: 150px;">Notas Internas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row" style="text-align: center; height:50%;"
                          >{recibos_order[arreglo].branchName} - "Sueldo {recibos_order[
                            arreglo
                          ].positionsName ?? ""}"</th
                        >
                        <td style="text-align: center;"> 1 </td>
                        <td
                          >{Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(recibos_order[arreglo].payamount / 2)}</td
                        >
                        <td
                          >{Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(recibos_order[arreglo].payamount / 2)}</td
                        >
                        <td class="no-print"> </td>
                      </tr>
                      {#if recibos_order[arreglo].extra.length > 0}
                        <tr>
                          <th
                            colspan="4"
                            scope="row"
                            style="text-align: center; height:50%;"
                            ><br />COMPLEMENTOS</th
                          >
                        </tr>
                      {/if}
                      {#each recibos_order[arreglo].extra as recibo}
                        <tr>
                          <th
                            scope="row"
                            style="text-align: center; height:50%;"
                            >{recibo.branchName ?? ""} - {recibo.detailName}</th
                          >
                          <td style="text-align: center;">{recibo.units}</td>
                          <td
                            >{Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(recibo.amount)}</td
                          >
                          <td
                            >{Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(recibo.units * recibo.amount)}</td
                          >
                          <td class="no-print">
                            {#if $permissions.admin || $permissions.nominas}
                              <button
                                on:click={() => {
                                  selDeleteId(recibo.uid);
                                }}
                                class="btn btn-danger waves-effect waves-light"
                              >
                                <i
                                  class="bx bx-x font-size-16 align-middle"
                                  disabled={loading}
                                >
                                </i>
                              </button>
                            {/if}
                          </td>
                          <td class="no-print" style="text-align: center;">
                            {#if recibo.notes}
                              Comentarios:{recibo.notes}
                            {/if}
                            <br />
                            Fecha:{recibo.added.toDate().toLocaleDateString()}
                          </td>
                        </tr>
                      {/each}
                      <tr>
                        <th scope="row"
                          >Total: <b>{recibos_order[arreglo].username}</b></th
                        >
                        <td style="text-align: center;"
                          >{recibos_order[arreglo].totalunits} Guardias {#if recibos_order[arreglo].extraunits > 0}<br
                            />{recibos_order[arreglo].extraunits} Complementos{/if}</td
                        >
                        <td></td>
                        <td
                          ><b>
                            {Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(recibos_order[arreglo].total)}</b
                          ></td
                        >
                        <td class="no-print">
                          {#if $permissions.admin || $permissions.nominas}
                            <button
                            type="button"
                            class="btn btn-light waves-effect"
                            on:click={() => {
                              setEditId(recibos_order[arreglo].uid);
                            }}
                            >
                              <i
                                class="bx bx-duplicate font-size-16 align-middle"
                              >
                              </i>
                            </button>
                          {/if}
                        </td>
                      </tr>
                      <tr style="height: 60px;">
                        <td
                          ><br
                          />_________________________________________________________________</td
                        >
                        <td></td>
                        <td colspan="2"
                          ><br
                          />_________________________________________________________________</td
                        >
                      </tr>
                      <tr>
                        <td>Observaciones</td>
                        <td></td>
                        <td colspan="2">Nombre y firma</td>
                      </tr>
                    </tbody>
                  </table>
                {:else}
                  <table
                    id="table"
                    class="table table-striped print-no-break mb-4 mt-4"
                  >
                    <thead>
                      <tr>
                        <th>
                          Personal #: <b>{recibos_order[arreglo].employee_number}
                          <!-- <img src="assets/images/logoprint.png" alt="logo"> -->
                        </th>
                        <th style="font-size:20px"><b>RECIBO</b></th>
                        <th>FOLIO: {recibos_order[arreglo].folio}</th>
                        <th>FECHA: {printdate}</th>
                      </tr>
                      <tr>
                        <th scope="col"
                          >Personal: <b>{recibos_order[arreglo].username}</b
                          ></th
                        >
                        <th style="text-align: center;">CANTIDAD</th>
                        <th style="text-align: center;">PRECIO</th>
                        <th>IMPORTE</th>
                        <th class="no-print">Acciones</th>
                        <th class="no-print" style="text-align: center; max-width: 150px;">Notas Internas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each recibos_order[arreglo].concepts as recibo}
                        <tr>
                          <th scope="row" style="text-align: center; height:50%;"
                            >{recibo.branchName} - "Guardia {recibo.positionsName ?? 
                              ""} ({recibo.amount.toFixed(2) ?? ""})"
                              {#if recibo.shared}
                                <span style="color: #34c38f; font-weight: bold;">Compartida</span>
                              {/if}
                          </th>         
                          <td style="text-align: center;">{recibo.units}</td>
                          <td style="text-align: center;"
                            >{recibo.amount.toFixed(2)}
                            <!--<i class="bx bx-edit font-size-16 align-middle no-print"></i>--></td
                          >
                          <td
                            >{Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(recibo.units * recibo.amount)}</td
                          >
                          <!-- {#if recibo.units < 2}
                                <td class="no-print">
                                  <button on:click={()=>{deleteDoc(recibo.uid)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>
                                </td>
                              {:else} -->
                          <td class="no-print">
                            {#if $permissions.admin || $permissions.nominas}
                              <button
                              on:click={() => {
                                selDeleteId(recibo.uid);
                              }}
                              class="btn btn-danger waves-effect waves-light"
                              >
                                <i
                                  class="bx bx-x font-size-16 align-middle"
                                  disabled={loading}
                                >
                                </i>
                              </button>
                            {/if}
                          </td>
                          <td class="no-print" style="text-align: center;">
                            {#if recibo.notes}
                              Comentarios:{recibo.notes}
                            {/if}
                            <br />
                            Fecha:{recibo.added.toDate().toLocaleDateString()}
                          </td>
                          <!-- {/if} -->
                        </tr>
                      {/each}
                      {#if recibos_order[arreglo].extra.length > 0}
                        <tr>
                          <th
                            colspan="4"
                            scope="row"
                            style="text-align: center; height:50%;"
                            ><br />COMPLEMENTOS</th
                          >
                        </tr>
                      {/if}
                      {#each recibos_order[arreglo].extra as recibo}
                        <tr>
                          <th
                            scope="row"
                            style="text-align: center; height:50%;"
                            >{recibo.branchName ?? ""} - {recibo.detailName}</th
                          >
                          <td style="text-align: center;">{recibo.units}</td>
                          <td style="text-align: center;"
                            >{recibo.amount.toFixed(2)}</td
                          >
                          <td
                            >{Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(
                              (recibo.units * recibo.amount).toFixed(2),
                            )}</td
                          >
                          <td class="no-print">
                            {#if $permissions.admin || $permissions.nominas}
                              <button
                              on:click={() => {
                                deleteDoc(recibo.id);
                              }}
                              class="btn btn-danger waves-effect waves-light"
                              >
                                <i
                                  class="bx bx-x font-size-16 align-middle"
                                  disabled={loading}
                                ></i>
                              </button>
                            {/if}
                          </td>
                          <td class="no-print" style="text-align: center;">
                            {#if recibo.notes}
                            Comentarios:{recibo.notes}
                            {/if}
                            <br />
                            Fecha:{recibo.added.toDate().toLocaleDateString()}
                          </td>
                        </tr>
                      {/each}
                      <tr>
                        <th scope="row"
                          >Total: <b>{recibos_order[arreglo].username}</b></th
                        >
                        <td style="text-align: center;"
                          >{recibos_order[arreglo].totalunits} Guardias {#if recibos_order[arreglo].extraunits > 0}<br
                            />{recibos_order[arreglo].extraunits} Complementos{/if}</td
                        >
                        <td></td>
                        <td
                          ><b
                            >{Intl.NumberFormat("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            }).format(recibos_order[arreglo].total)}</b
                          ></td
                        >
                        <td class="no-print">
                          {#if $permissions.admin || $permissions.nominas}
                            <button
                              type="button"
                              class="btn btn-light waves-effect"
                              on:click={() => {
                                setEditId(recibos_order[arreglo].uid);
                              }}
                              ><i
                                class="bx bx-duplicate font-size-16 align-middle"
                              ></i></button
                            >
                          {/if}
                        </td>
                      </tr>
                      <tr style="height: 60px;">
                        <td
                          ><br
                          />_________________________________________________________________</td
                        >
                        <td></td>
                        <td colspan="2"
                          ><br
                          />_________________________________________________________________</td
                        >
                      </tr>
                      <tr>
                        <td>Observaciones</td>
                        <td></td>
                        <td colspan="2">Nombre y firma</td>
                      </tr>
                    </tbody>
                  </table>
                {/if}
              {/if}
            {/if}
          {/each}
        {:else if report == "2"}
          <table
            id="table"
            class="table table-striped print-no-break mb-4 mt-4"
          >
            <tbody>
              <tr>
                <th>
                  <!-- <img src="assets/images/logoprint.png" alt="logo"> -->
                </th>
                <th style="text-align: center;">TOTALES DE RECIBOS</th>
                <th style="text-align: center;">FECHA: {printdate}</th>
              </tr>
              <tr>
                <th scope="col" style="text-align: left;">PERSONAL</th>
                <th style="text-align: left;">CANTIDAD</th>
                <th style="text-align: left;">ESTANCIA</th>
                <th style="text-align: left;">IMPORTE</th>
              </tr>
              {#each Object.keys(recibos_order) as arreglo}
                {#if filter == "All" || filter == recibos_order[arreglo].paymentperiod}
                  <tr>
                    <td scope="row" style="text-align: left;"
                      >{recibos_order[arreglo].username}</td
                    >
                    <td style="text-align: left;"
                      >{recibos_order[arreglo].totalunits} Guardias {#if recibos_order[arreglo].extraunits > 0}<br
                        />{recibos_order[arreglo].extraunits} Complementos{/if}</td
                    >
                    <td style="text-align: left;"
                      >{recibos_order[arreglo].branchName}</td
                    >
                    <td style="text-align: left;"
                      >{Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(recibos_order[arreglo].total)}</td
                    >
                  </tr>
                {/if}
              {/each}
              <tr>
                <td style="text-align: center;" colspan="3">Total de nomina:</td
                >
                <td style="text-align: left;"
                  ><b
                    >$ {filter == "All"
                      ? Intl.NumberFormat("en-US").format(
                          total_sem +
                            total_quin +
                            total_esp +
                            total_mant +
                            total_banca,
                        )
                      : filter == "Semanal"
                        ? Intl.NumberFormat("en-US").format(total_sem)
                        : filter == "Quincenal"
                          ? Intl.NumberFormat("en-US").format(total_quin)
                          : filter == "Mantenimiento"
                            ? Intl.NumberFormat("en-US").format(total_mant)
                            : filter == "Banca"
                              ? Intl.NumberFormat("en-US").format(total_banca)
                              : filter == "Proyecto"
                                ? Intl.NumberFormat("en-US").format(total_proyecto)
                              : Intl.NumberFormat("en-US").format(total_esp)}</b
                  ></td
                >
              </tr>
            </tbody>
          </table>
          {:else}
            {#if filterBranch == "All" || Object.keys(totalsByConcept[Object.keys(totalsByConcept)[0]]?.branches || {}).includes(filterBranch)}
              <table
                id="table"
                class="table table-striped print-no-break mb-4 mt-4"
              >
                <tbody>
                  <tr>
                    <th></th>
                    <th style="text-align: center;">TOTALES POR CONCEPTO</th>
                    <th style="text-align: center;">FECHA: {printdate}</th>
                  </tr>
                  <tr>
                    <th scope="col" style="text-align: left;">CONCEPTO</th>
                    <th style="text-align: left;">MONTO TOTAL</th>
                    <th style="text-align: left;">CANTIDAD TOTAL</th>
                  </tr>

                  {#each Object.keys(totalsByConcept).filter(concept =>
                    filterBranch === "All" || totalsByConcept[concept]?.branches?.[filterBranch]
                  ) as concept}
                    <tr>
                      <td style="text-align: left;">{concept}</td>
                      <td style="text-align: left;">
                        {#if filterBranch === "All"}
                          {Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(totalsByConcept[concept].totalAmount)}
                        {:else}
                          {Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(totalsByConcept[concept]?.branches?.[filterBranch]?.totalAmount || 0)}
                        {/if}
                      </td>
                      <td style="text-align: left;">
                        {#if filterBranch === "All"}
                          {totalsByConcept[concept].totalUnits}
                        {:else}
                          {totalsByConcept[concept]?.branches?.[filterBranch]?.totalUnits || 0}
                        {/if}
                      </td>
                    </tr>
                  {/each}

                  <tr>
                    <td style="text-align: center;" colspan="2">Total en conceptos:</td>
                    <td style="text-align: left;">
                      <!-- <b>$ {filter == "All"
                          ? Intl.NumberFormat("en-US").format(
                              total_sem +
                                total_quin +
                                total_esp +
                                total_mant +
                                total_banca,
                            )
                          : filter == "Semanal"
                            ? Intl.NumberFormat("en-US").format(total_sem)
                            : filter == "Quincenal"
                              ? Intl.NumberFormat("en-US").format(total_quin)
                              : filter == "Mantenimiento"
                                ? Intl.NumberFormat("en-US").format(total_mant)
                                : filter == "Banca"
                                  ? Intl.NumberFormat("en-US").format(total_banca)
                                  : Intl.NumberFormat("en-US").format(total_esp)}</b> -->
                      <b>
                        {Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN"
                        }).format(totalBranchAmount)}
                      </b>         
                    </td>
                  </tr>
                </tbody>
              </table>
            {/if}
          {/if}
      </div>
    </div>
  </div>
</div>

<div
  class="modal fade"
  id="editModalScrollable"
  tabindex="-1"
  role="dialog"
  aria-labelledby="editModalScrollableTitle"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-scrollable">
    <div class="modal-content" style="overflow-y: scroll;">
      <div class="modal-header">
        <h5 class="modal-title mt-0" id="editModalScrollableTitle">
          Agregar Registros de pagos
        </h5>

        <button
          type="button"
          class="close"
          on:click={() => {
            editData = {};
            jQuery("#editModalScrollable").modal("hide");
            showModal = false;
          }}
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      {#if showModal}
        <PatientlogEdit
          values={editData}
          onBack={() => {
            editData = {};
            jQuery("#editModalScrollable").modal("hide");
            showModal = false;
          }}
        />
      {/if}
    </div>
    <!-- /.modal-content -->
  </div>
  <!-- /.modal-dialog -->
</div>

<div
  class="modal fade"
  id="DeleteModalScrollable"
  tabindex="-1"
  role="dialog"
  aria-labelledby="DeleteModalScrollableTitle"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-scrollable">
    <div class="modal-content" style="overflow-y: scroll;">
      <div class="modal-header">
        {#if deleteData && deleteData.allRecords && deleteData.allRecords.length > 0}
          <h5 class="modal-title mt-0" id="DeleteModalScrollableTitle">
            Eliminar Registros de Pagos <br />{deleteData.username}
            <br><small>({deleteData.allRecords.length} registros)</small>
          </h5>
        {:else}
          <h5 class="modal-title mt-0" id="DeleteModalScrollableTitle">
            No hay registros para {deleteData.username || "este usuario"}
          </h5>
        {/if}
        <button
          type="button"
          class="close"
          on:click={() => {
            deleteData = {};
            jQuery("#DeleteModalScrollable").modal("hide");
            showModal = false;
          }}
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <table id="tableDel" class="tableDel table-striped">
        <thead>
          <tr>
            <!-- <th>#</th> -->
            <th>Estancia/Puesto</th>
            <!-- <th>Unidades</th> -->
            <th>Importe</th>
            <th>Fecha</th>
            <th>Turno*</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#if deleteData && deleteData.allRecords && deleteData.allRecords.length > 0}
            {#each deleteData.allRecords as recibo}
              <tr>
                <td>
                  {recibo.branchName}/{recibo.positionsName || ""}
                  {#if recibo.detailName && recibo.detailName !== "Guardia"}
                    <br><small><em>{recibo.detailName}</em></small>
                  {/if}
                  {#if recibo.sharedWorkers && recibo.sharedWorkers.length > 0}
                    <br>
                    <small>
                      {#if recibo.shared}
                        <span style="color: #34c38f; font-weight: bold;">Compartida</span>
                        <br>
                      {/if}
                      {#each recibo.sharedWorkers as sharedWorker, index}
                        {sharedWorker}
                        {#if index !== recibo.sharedWorkers.length - 1}, <br>{/if}
                      {/each}
                    </small>
                  {/if}
                </td>
                <td>
                  {#if editingIndex === recibo.id}
                    <input
                      type="number"
                      bind:value={recibo.amount}
                      on:blur={() => saveAmount(recibo.id, recibo.amount)}
                      class="form-control"
                      step="0.01"
                    />
                  {:else}
                    <span
                      on:dblclick={() => {
                        editingIndex = recibo.id;
                      }}
                    >
                      {recibo.amount.toFixed(2)}
                    </span>
                  {/if}
                </td>
                <td>{DateTime.fromJSDate(recibo.added.toDate()).toISODate()}</td>
                <td>{recibo.nightShift ? "Noche" : "Día"}</td>
                <td>
                  {#if $permissions.admin || $permissions.nominas}
                    <button
                      on:click={() => {
                        deleteDoc(recibo.id);
                      }}
                      class="btn btn-danger waves-effect waves-light"
                    >
                      <i
                        class="bx bx-x font-size-16 align-middle"
                        disabled={loading}
                      ></i>
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="6">No hay registros para mostrar</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    <!-- /.modal-content -->
  </div>
  <!-- /.modal-dialog -->
</div>

<style>
  img {
    height: 100px;
  }
  .table td,
  .table th {
    vertical-align: middle;
    padding: 0px !important;
  }
  .tableDel {
    border: none !important;
    border-collapse: inherit !important;
    padding: 20px;
    width: 100%;
    page-break-inside: avoid;
    min-height: 100px !important;
  }
  table {
    border: 2px #000000 solid;
    border-collapse: inherit !important;
    padding: 20px;
    width: 100%;
    page-break-inside: avoid;
    min-height: 500px;
  }
  @media print {
    .table-striped tbody tr:nth-of-type(odd) td {
      background-color: rgba(0, 0, 0, 0.05) !important;
    }
  }
  @page {
    size: auto;
  }
</style>
