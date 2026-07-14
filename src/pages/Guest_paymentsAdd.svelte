<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import { patients } from "../controls/patients.js";
  import PatientsSearchList from "../controls/PatientsSearchList.svelte";

  export let params = {};
  export let values = {};
  export let autoAdd = false;

  let old = {};
  let adder = {};
  let exists = false;

  let patientdata = {};

  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;

  const tempId = params.bid;

  let today = DateTime.local()
    .setLocale("es-mx")
    .toLocaleString(DateTime.DATE_FULL);

  values.other = [];

  values.date = today;

  let payments = {};

  var currentPayments = {};

  values.guestid = tempId;

  //$: values, Calculo();
  $: adder, checkPayment();

  let months = [
    { mes: "Enero", monthnum: "01" },
    { mes: "Febrero", monthnum: "02" },
    { mes: "Marzo", monthnum: "03" },
    { mes: "Abril", monthnum: "04" },
    { mes: "Mayo", monthnum: "05" },
    { mes: "Junio", monthnum: "06" },
    { mes: "Julio", monthnum: "07" },
    { mes: "Agosto", monthnum: "08" },
    { mes: "Septiembre", monthnum: "09" },
    { mes: "Octubre", monthnum: "10" },
    { mes: "Noviembre", monthnum: "11" },
    { mes: "Diciembre", monthnum: "12" },
  ];
  let ytoday = DateTime.local().year;
  let years = [
    { year: ytoday },
    { year: ytoday-1 },
    { year: ytoday-2 },
  ];
  var folio = 1000;

  // revisar si es undefined, hacerle spli por , por cada pid se genera un other en values push al other agregar un input a la tabla para la cantidad a pagar
  if (filterName != undefined && filterValue != undefined) {
    //console.log("filter : "+filterName+" == "+filterValue)
    values[filterName] = filterValue;
  }

  onMount(() => {
    form = document.getElementById("form");
    var defaultOptions = {};

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
            loading = false;
            patientdata = query.data();
            console.log("patient_data", patientdata);
            old = query.data();
            values.name = patientdata.name;
            values.monthcost = patientdata.monthcost;
            values.familiarpay = patientdata.responsible_name;
            checkPayment();
            if (patientdata.branch != undefined) {
              db.collection("branches")
                .doc(patientdata.branch)
                .get()
                .then((branch) => {
                  if (
                    branch !== undefined &&
                    branch.data() != undefined &&
                    branch.data().pay_folio != undefined
                  ) {
                    folio = branch.data().pay_folio + 1;
                  }
                });
            }
          }
        });
    }
  });

  function cancel() {
    pop();
  }

  function checkPayment() {
    if (
      adder.year == undefined ||
      adder.month == undefined ||
      patientdata.paymentlogs == undefined
    ) {
      console.log("no initial data", adder, patientdata);
      return;
    }
    var pid = adder.year + "-" + adder.month + "-01";
    var payment = patientdata.paymentlogs[pid];
    console.log("payment", payment);
    if (payment != undefined) {
      if (payment.pay == true) {
        adder.canPay = "Mes ya pagado";
      } else {
        adder.canPay = "Mes ya tiene adeudo";
      }
    } else {
      //console.log(values);
      adder.canPay = "";
      for (let index = 0; index < values.other.length; index++) {
        const element = values.other[index];
        if (element.month == adder.month && adder.year == element.year) {
          adder.canPay = "Mes agregado";
        }
      }
    }
  }
  function updateData() {
    let dateId;
    for (let i = 0; i < values.other.length; i++) {
      dateId = values.other[i].year + "-" + values.other[i].month + "-01";
      const elementdates = DateTime.fromISO(dateId).setLocale("es-mx");
      // console.log(elementdates);
      const datePretty = elementdates.toLocaleString({
        month: "long",
        year: "numeric",
      });
      //console.log(dateId);
      payments[dateId] = {
        dateId: dateId,
        datedisplay: datePretty,
        check: true,
        debt: values.other[i].amount,
        pay: false,
      };
    }
    values.logs = {
      paymentlogs: payments,
    };

    if (patientdata.paymentlogs == undefined) {
      currentPayments = values.logs.paymentlogs;
    } else {
      currentPayments = {
        ...patientdata.paymentlogs,
        ...values.logs.paymentlogs,
      };
    }
    values.logs = { paymentlogs: currentPayments };

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
    // TODO: hace transacion para el folio
    values.added = timenow;

    // db.runTransaction((transaction) => {
    //     // This code may get re-run multiple times if there are conflicts.
    //     return transaction.get(folioDocRef).then((folioDoc) => {

    //         if (!folioDoc.empty) {
    //           //folioDoc.data().folio + 1
    //             //throw "Document does not exist!";
    //             //folio stays the same
    //             folio = folioDoc.docs[0].data().folio + 1;
    //             //transaction.update(sfDocRef, { population: newPopulation });
    //         }
    //         values.folio = folio;
    //         transaction.set(db.collection("guest_payments")
    //           .doc(), values)
    //           //.set(values)
    //           .then(function () {
    //             loading = false;
    //             //pop();
    //           });

    //         if (tempId != null) {
    //           //Actualizar si tiene id

    //           values.edited = timenow;
    //           // haces un for por cada concepto del pago
    //           // si esta pagado o pagado a medias
    //           // hay que checar si payments es undefined , si es  = []
    //           // guardas en "payments".push({
    //           //     dateId: dateId, (va ser el chido, aqui veo si mi mes ya esta pagado)
    //           //     tdini: tdini,
    //           //     pending: 0, (si esta completamente pagado, o amount si esta pendiente)
    //           //     pay: false, (depende si esta todo pagado o no)
    //           //     id: id, (folio del recibo de pago)
    //           // });

    //           transaction.update( db.collection("patients")
    //             .doc(tempId),
    //             values.logs) // cambia porq hay q guardar el payments
    //             .then(function () {
    //               loading = false;
    //               pop();
    //             });
    //         } else {
    //           //Crear nuevo si no tiene
    //           // values.added = timenow;
    //           // transaction.set(db.collection("patients").doc()
    //           //   .add(values.logs)
    //           //   .then(function () {
    //           //     loading = false;
    //           //     pop();
    //           //   });
    //         }

    //     });
    // }).then(() => {
    //     console.log("Transaction successfully committed!");
    // }).catch((error) => {
    //     console.log("Transaction failed: ", error);
    // });

    let branchDocRef = db.collection("branches").doc(patientdata.branch);
    db.runTransaction((transaction) => {
      // This code may get re-run multiple times if there are conflicts.
      return transaction.get(branchDocRef).then((bDoc) => {
        if (!bDoc.exists) {
          throw "Document does not exist!";
        }
        var newFolio = folio;
        if (bDoc.data().pay_folio != undefined) {
          newFolio = bDoc.data().pay_folio + 1;
        }

        transaction.update(branchDocRef, { pay_folio: newFolio });
        folio = newFolio;
        values.folio = newFolio;
        transaction
          .update(db.collection("patients").doc(tempId), values.logs); // cambia porq hay q guardar el payments
          
      });
    }).then(function () {
            loading = false;
            pop();
          });
  }
  /*
  function updateData() {
    
    if(!form.checkValidity()){
      form.reportValidity();
      
        jQuery(".tab-pane").length
        for(var elem of form.elements){
          if(!elem.checkValidity()){ 
            $('.nav-tabs a[href="#personal-tab"]').tab('show');
            form.reportValidity();
            console.log(elem);
          }
        };
      
      return;
    }
    loading = true;
    
    if (tempId != null) {
      //Actualizar si tiene id
      if(!exists){
        values.added = timenow;
        db.collection("patients")
          .doc(tempId)
          .set(values)
          .then(function () {
            loading = false;
            pop();
          });
      }else{
        values.edited = timenow;
        db.collection("guest_payments")
          .doc(tempId)
          .update(values)
          .then(function () {
            loading = false;
            pop();
          });
      }
      
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("guest_payments")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
  */
  function addToTable(field, adderValues) {
    if (values[field] == undefined) {
      values[field] = [];
    }
    values[field].push(adderValues);
    values = values;
    checkPayment();
    //adder = {};
  }
  function deleteFromTable(field, idx) {
    if (values[field] != undefined) {
      values[field].splice(idx, 1);
    }
    values = values;
  }

  /*pendientes
1.-definir variable de patients para tipo de pago mensual o quincenal


2.- agregar la sucursal


dateId: dateId,
                        tdini: tdini,
                        check: index == 0 ? true : false,
                        pay: false,
                        datedisplay: datePretty,
                        id: id,
                        

*/
  function printObject() {}
</script>

<div class="page-content">
  <TitleBar title="Agregar Adeudo huesped" base="Inventario" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h3>Adeudo:</h3>

            <div class="form-group row">
              <label for="#select-patients" class="col-md-4 col-form-label"
                >Nombre Residente:
              </label>
              <div class="col-md-8">{values.name}</div>
            </div>

            <div class="form-group row">
              <div className="col-12">
                <div class="table-responsive">
                  <table class="table table-sm mb-0">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Mes:</th>
                        <th>Año:</th>
                        <th>Monto:</th>
                        <th>Agregar</th>
                      </tr>
                    </thead>

                    <tr id="addschedule">
                      <td>+</td>
                      <td>
                        <select class="form-control " bind:value={adder.month}>
                          {#each months as month}
                            <option value={month.monthnum}>{month.mes}</option>
                          {/each}
                        </select>
                      </td><td>
                        <select class="form-control " bind:value={adder.year}>
                          {#each years as year}
                            <option value={year.year}>{year.year}</option>
                          {/each}
                        </select>
                      </td>
                      <td>
                        <input
                          class="form-control "
                          type="number"
                          bind:value={values.monthcost}
                          id="amount"
                        />
                      </td>
                      <td>
                        <div class="font-icon-wrapper">
                          {#if adder.canPay != undefined && adder.canPay != ""}
                            {adder.canPay}
                          {:else}
                            <button
                              type="button"
                              class="btn btn-outline-success"
                              on:click={() => {
                                addToTable("other", {
                                  month: adder.month,
                                  year: adder.year,
                                  amount: values.monthcost,
                                });
                              }}>+<i className="zmdi zmdi-plus" /></button
                            >
                          {/if}
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>

            <div class="form-group row">
              <label for="additional_comments" class="col-md-4 col-form-label"
                >Observaciones:</label
              >
              <div class="col-md-8">
                <textarea
                  class="form-control "
                  type="text"
                  bind:value={values.additional_comments}
                  id="additional_comments"
                />
              </div>
            </div>

            <table
              class="table table-striped table-bordered dt-responsive nowrap"
              style="border-collapse: collapse; border-spacing: 0; width: 100%;"
            >
              <thead>
                <tr>
                  <th>Mes: </th>
                  <th>Año: </th>
                  <th>Costo mensual: </th>
                </tr>
              </thead>

              <tbody>
                {#each values.other as pagos}
                  <tr style="background-color:#F7FBB4">
                    <td>{pagos.month}</td>
                    <td>{pagos.year}</td>
                    <td>${pagos.amount}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </form>

  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <button
            type="button"
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
</div>
