<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import { patients } from "../controls/patients.js";
  import PatientsSearchList from "../controls/PatientsSearchList.svelte";
  import PaytypeSelect from "../controls/PaytypeSelect.svelte";
  import PaymentsEdit from "./PaymentsEdit.svelte";
  import BranchesSearchList from "../controls/BranchesSearchList.svelte";
  import { branches } from "../controls/branches.js";
    import { permissions } from "../stores";
  import {calculatePercent} from "../Utils/payments.js";

  export let params = {};
  export let values = {};
  export let autoAdd = false;
  export let insert = {};

  let concepts = ["Separación","Inscripción","Mensualidad" ];

  let old = {};
  let adder = {};
  let exists = false;
  let selectdate = DateTime.local().toISODate();
  let printdate = DateTime.local().toISODate();
  let newprintdate = DateTime.fromISO(printdate)
    .setLocale("es-mx")
    .toLocaleString(DateTime.DATE_FULL);

  console.log(params);

  $: selectdate,
    (newprintdate = DateTime.fromISO(selectdate)
      .setLocale("es-mx")
      .toLocaleString(DateTime.DATE_FULL));

  let patientdata = {};
  let branchesfol;

  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;

  const temppids = params.pids;
  const pid = params.pid;
  const amountIntro = params.amount;

  var pidses = temppids?.split(",") ?? [];

  let tempId = params.pid;

  let restante = 0;

  let credit = 0;

  let payments = {};

  let today = DateTime.local()
    .setLocale("es-mx")
    .toLocaleString(DateTime.DATE_FULL);
  let advancedpayment = 0;
  let adeudo = 0;
  let receiptdate;
  values.total = 0;

  values.concepts = [];

  values.date = today;

  values.paydate = DateTime.local().setLocale("es-mx").toISODate();

  values.guestid = tempId;

  $: values, newprintdate, Calculo();

  var currentPayments = {};

  let printreceipt = true;
  let folio = 1000;
  // revisar si es undefined, hacerle spli por , por cada pid se genera un other en values push al other agregar un input a la tabla para la cantidad a pagar
  if (filterName != undefined && filterValue != undefined) {
    //console.log("filter : "+filterName+" == "+filterValue)
    values[filterName] = filterValue;
  }

  if (pid != undefined) {
    loading = true;
    db.collection("recipt_payments")
      .doc(pid)
      .get()
      .then(function (query) {
        if (query == null || query == undefined || query.data() == null) {
          //No data crear
          //pop();
        } else {
          printreceipt = true;
          values = query.data();
          console.log("recipt",values);
          receiptdate = values.date;
          tempId = values.guestid;
          // getPatientInfo();
          db.collection("branches")
            .doc(values.branch)
            .get()
            .then((branch) => {
              if (
                branch !== undefined &&
                branch.data() != undefined &&
                branch.data().pay_folio != undefined
              ) {
                // console.log(branch.data());
                folio = branch.data().pay_folio + 1;
                branchesfol = branch.data().folio;
              }
            });
        }
        loading = true;
      });
  }
  // getPatientInfo();

  function getPatientInfo() {
    if (tempId == undefined) {
      return;
    }

    db.collection("patients")
      .doc(tempId)
      .get()
      .then(async function (query) {
        if (query == null || query == undefined || query.data() == null) {
          //No data crear
          //pop();
        } else {
          exists = true;
          patientdata = query.data();
          patientdata.id = query.id;
          old = query.data();
          values.name = patientdata.name;
          values.monthcost = patientdata.monthcost;
          values.branch = patientdata.branch;
          values.familiarpay = patientdata.responsible_name;
          values.paytype = 1;
          values["concepts"] = [];
          if (patientdata.credit != undefined) {
            values.credit = patientdata.credit;
          } else {
            values.credit = 0;
          }
          if (patientdata.remainder != undefined && patientdata.credit) {
            advancedpayment = patientdata.credit;
          }
          if (patientdata.paymentlogs == undefined) {
            patientdata.paymentlogs = {};
          }
          // CALCULAR DE PAGOS
          patientdata = await calculatePercent(patientdata);
          console.log("patientdata",patientdata);
          if (patientdata.status == 3) {
            
            
            if (patientdata.sepationPercentage < 100){
              values["concepts"].push({
                concept: 0,
                amount:  patientdata.monthcost - patientdata.separationpaid,
                canEdit:true,
                canRemove:false
              });
            }

          }
          if(patientdata.introcheck){
            values["concepts"].push({
              concept: 1,
              amount: patientdata.introcost,
              canEdit:false,
              canRemove:false
            });	
          }
        loading = false;
        console.log(values);
        for (let index = 0; index < pidses.length; index++) {
          const element = pidses[index];
          const elementdates = DateTime.fromISO(pidses[index]).setLocale(
            "es-mx",
          );
          const datePretty = elementdates.toLocaleString({
            month: "long",
            year: "numeric",
          });

          if (patientdata.paymentlogs[element] != undefined) {
            adeudo = patientdata.paymentlogs[element].debt;
            receiptdate = patientdata.paymentlogs[element].paydatedisplay;
            console.log(receiptdate);
            values.concepts.push({
              concept: "Pago del mes: " + datePretty,
              datePretty: datePretty,
              amount: adeudo,
              id: element,
              paid: 0,
            });
          } else {
            values.concepts.push({
              concept: "Pago del mes: " + datePretty,
              datePretty: datePretty,
              amount: values.monthcost,
              id: element,
              paid: 0,
            });
          }
        }

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
                // console.log(branch.data());
                folio = branch.data().pay_folio + 1;
                branchesfol = branch.data().folio;
              }
            });
        }

        if(amountIntro != undefined && amountIntro > 0){

          let datePretty = DateTime.local().toLocaleString({
            month: "long",
            year: "numeric",
          });
          values.concepts.push({
              concept: "Pago inscripción ",
              datePretty: datePretty,
              amount: (patientdata.introcost ?? 0) - (patientdata.intropaid ?? 0) ,
              id: "intro",
              paid: 0,
            });
        }
        //console.log(values.other);
      }});
  }

  onMount(() => {
    form = document.getElementById("form");
    var defaultOptions = {};
    jQuery(".input-mask").inputmask();
  });

  function cancel() {
    pop();
  }

  async function updateData() {
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
    let branchDocRef = db.collection("branches").doc(values.branch);
    await db.runTransaction((transaction) => {
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
      });
    });
    // TODO: hace transacion para el folio
    values.added = timenow;
    values.transit = 0;
    let newDoc = await db.collection("recipt_payments")
      .doc();
    let newId = newDoc.id;
    newDoc.set(values);

    if (tempId != null && values.concepts != undefined) {
      //Actualizar si tiene id

      values.edited = timenow;
      let updateData = {
        edited: timenow,
        editedby: user.uid,
        separationpaid: patientdata.separationpaid ?? 0,
        intropaid: patientdata.intropaid ?? 0,
      };
      let hasUpdate = false;
      for (let index = 0; index < values.concepts.length; index++) {
        if (values.concepts[index].concept == 0) {
          updateData.separationpaid += values.concepts[index].amount;
          hasUpdate = true;
        }
        if (values.concepts[index].concept == 1) {
          updateData.intropaid = values.concepts[index].amount;
          hasUpdate = true;
        }
      }
      
      
      if(hasUpdate){
        await db.collection("patients")
          .doc(tempId)
          .update(updateData)
          .then(function () {
            loading = false;
            //pop();
          });
      }

      // db.collection("patients")
      //   .doc(tempId)
      //   .update(values.logs) // cambia porq hay q guardar el payments
      //   .then(function () {
      //     loading = false;
      //     //pop();
      //   });
    }
    window.location.href = "#/recipt_payments/" + newId + "/";
    //printreceipt = true;
    //GOTO recipt_payments/newId
  }
  function addToTable(field, adderValues) {
    if (values[field] == undefined) {
      values[field] = [];
    }
    values[field].push(adderValues);
    values = values;
    adder = {concepts:0};
  }
  function deleteFromTable(field, idx) {
    if (values[field] != undefined) {
      values[field].splice(idx, 1);
    }
    values = values;
  }

  let error = "";
  function Calculo() {
    values.valid = false;
    error = "";
    if (values.concepts == undefined || values.concepts.length < 1) {
      return;
    }
    let valid = true;
    let totalpago = 0;
    
    for (let index = 0; index < values.concepts.length; index++) {
      totalpago += values.concepts[index].amount;
      if (values.concepts[index].concept == 0) {
        if (values.concepts[index].amount < patientdata.monthcost * 0.3) {
          valid = false;
          error = "El pago no puede ser menor al 30% de la menusalidad";
        }
        if (values.concepts[index].amount > patientdata.monthcost) {
          valid = false;
          error = "El pago no puede ser mayor a la menusalidad";
        }
      }
    }
    

    values.total = totalpago;
    if(valid){
      values.valid = true;
    }
  }


  function CalculoBack(totalpago) {
    if (totalpago == undefined) {
      totalpago = values.total + advancedpayment;
    }

    if (values.concepts == undefined || values.concepts.length < 1) {
      return;
    }

    let abono = 0;

    // console.log("Pagos");
    // console.log(values.other);

    for (let index = 0; index < values.concepts.length; index++) {
      // console.log(totalpago);
      restante = totalpago -= values.concepts[index].amount;

      if (restante >= 0) {
        values.concepts[index].paid = values.concepts[index].amount;
      }

      if (restante < 0) {
        abono = restante + values.concepts[index].amount;
        if (abono >= 0) {
          values.concepts[index].paid = abono;
        } else {
          values.concepts[index].paid = 0;
        }
        /*
        console.log( "el abono es: " + abono);
        break;
        */
      }
    }
    if (amountIntro != undefined && amountIntro > 0) {
      restante = 0;
    }
    //console.log( "el restante es: " + restante);
    /* este debt no esta referenciado, no se usó...
    if (restante < 0) {
      let debt = -restante;
    ]*/
    //console.log("la deuda es:" + debt);

    //console.log("los pagos resultado:");

    //values.other = {date : today};
    //console.log(values.other);
    for (let v = 0; v < values.concepts.length; v++) {
      let dateId = values.concepts[v].id;
      if (dateId == "intro") {
        continue;
      }
      // console.log(dateId);
      //falta agregar FOLIO
      if (dateId != undefined) {
        if (values.concepts[v].amount === values.concepts[v].paid) {
          payments[dateId] = {
            dateId: dateId,
            check: true,
            datedisplay: values.concepts[v].datePretty,
            amount: values.concepts[v].amount,
            paid: values.concepts[v].paid,
            pay: true,
            debt: 0,
            paydatedisplay: newprintdate,
            date: today,
            paydate: values.paydate,
            paytype: values.paytype,
          };
        } else {
          var deudames = values.concepts[v].amount - values.concepts[v].paid;
          payments[dateId] = {
            dateId: dateId,
            check: true,
            datedisplay: values.concepts[v].datePretty,
            amount: values.concepts[v].amount,
            paid: values.concepts[v].paid,
            pay: false,
            debt: deudames,
            paydatedisplay: newprintdate,
            date: today,
            paydate: values.paydate,
            paytype: values.paytype,
          };
        }
      }
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
    values.payments = payments;
    // Verificar el valor de restante y asignar la clave correspondiente
    values.logs = {
      [restante >= 0 ? "credit" : "remainder"]: restante,
      paymentlogs: currentPayments,
    };
    // values.logs = {
    //   [restante >= 0 ? 'credit' : 'remainder']: restante != undefined ? restante : 0,
    //   paymentlogs: currentPayments,
    // };
    console.log(values);
    // console.log(values.logs);
    // values.logs = { remainder: restante > 0 ? restante:0, paymentlogs: currentPayments };
  }

  function printPayment() {
    window.print();
    // window.location.href = "#/patient_payments/";
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Pago huesped" base="Inventario" />
  {#if !printreceipt}
    <form id="form">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h3>Pago:</h3>

              <div class="form-group row">
                <label for="entrydate" class="col-md-4 col-form-label"
                  >Fecha de pago</label
                >
                <div class="col-md-2">
                  {#if $permissions.admin || $permissions.accounting}
                  <input
                    type="date"
                    class="form-control"
                    name="printdate"
                    id="printdate"
                    bind:value={selectdate}
                  />
                  {:else}
                    {DateTime.local().toLocaleString(DateTime.DATE_FULL)}
                  {/if}
                </div>
              </div>

              <div class="form-group row">
                <label for="#select-patients" class="col-md-4 col-form-label"
                  >Nombre Residente:
                </label>
                <div class="col-md-8">{values.name}</div>
              </div>

              <div class="form-group row">
                <label for="name" class="col-md-4 col-form-label"
                  >Nombre del familiar que hace el pago:
                </label>
                <div class="col-md-8">
                  <input
                    class="form-control"
                    type="text"
                    bind:value={values.familiarpay}
                    id="familiarpay"
                    required
                  />
                </div>
              </div>

              

              <div class="form-group row">
                <label for="pay_type" class="col-md-4 col-form-label"
                  >Forma de pago</label
                >
                <div class="col-md-4">
                  {#if $permissions.admin || $permissions.accounting}
                    <PaytypeSelect
                      bind:value={values.paytype}
                      inlist={false}
                      required
                    />
                  {:else}
                    Efectivo
                  {/if}
                </div>
              </div>

              <div class="form-group row">
                <label for="paynumber" class="col-md-4 col-form-label"
                  >Folio</label
                >
                <div class="col-md-4">
                  <BranchesSearchList
                    value={values.branch}
                    inlist={true}
                    withStyle={false}
                  />{branchesfol}{folio}
                </div>
              </div>

              <div class="form-group row">
                <label for="concepts" class="col-12 col-form-label"
                  >Concepto a pagar:</label
                >
                
                <div class="col-12">
                  <div class="">
                    <table class="table table-sm mb-0">
                      <thead class="thead-light">
                        <tr>
                          <th>#</th>
                          <th>Concepto</th>
                          <th>Monto:</th>
                          <th>Agregar</th>
                        </tr>
                      </thead>
                      {#if values.concepts != undefined}
                        <tbody>
                          {#each values.concepts as subfield, sfk}
                            <tr>
                              <th scope="row">{sfk + 1}</th>
                              <td>
                                <PaytypeSelect
                          options={concepts}
                              bind:value={subfield.concept}
                              inlist={true}
                              required
                            /></td><td
                                >
                                {#if subfield.canEdit}
                                  <input
                                    class="form-control"
                                    type="number"
                                    bind:value={subfield.amount}
                                    id="amount"
                                    placeholder="Monto:"
                                    
                                  />
                                  {#if subfield.concept == 0 && subfield.amount < (patientdata.monthcost *0.3) }
                                    <small class="text-danger"
                                      ><b>El pago no puede ser menor al 30% de la menusalidad (mínimo ${(patientdata.monthcost *0.3).toLocaleString("es-MX")})</b
                                    ></small>
                                    {/if}
                                    {#if subfield.concept == 0 && subfield.amount > patientdata.monthcost }
                                    <small class="text-danger"
                                      ><b>El pago no puede ser mayor a la menusalidad (${(patientdata.monthcost ).toLocaleString("es-MX")})</b
                                    ></small>
                                    {/if}
                                {:else}
                                  ${subfield.amount.toLocaleString("es-MX")}
                                {/if}
                                </td
                              >
                              <td>
                                {#if subfield.canRemove != false}
                                  <button
                                    type="button"
                                    class="btn btn-outline-error"
                                    on:click={() => {
                                      deleteFromTable("concepts", sfk);
                                    }}>x<i className="zmdi zmdi-plus" /></button
                                  >
                                {/if}
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      {/if}
                      <!-- <tr id="addschedule">
                        <td>+</td>
                        <td>
                          <PaytypeSelect
                          options={concepts}
                              bind:value={adder.concept}
                              inlist={false}
                              required
                            />
                        </td><td>
                          <input
                            class="form-control"
                            type="number"
                            bind:value={adder.amount}
                            id="amount"
                            placeholder="Monto:"
                          />
                        </td>
                        <td>
                          <div class="font-icon-wrapper">
                            
                          </div>
                        </td>
                      </tr> -->
                    </table>
                  </div>
                </div>
              </div>
              {#if patientdata.status == 1}
              <button
                type="button"
                class="btn btn-outline-success"
                on:click={() => {
                  addToTable("concepts", {
                    concept: 2,
                    amount: patientdata.monthcost,
                  });
                }}>+<i class="zmdi zmdi-plus" /> Agregar Mensualidad</button
              >
              {/if}
                            <hr />
                            <div class="row">
                              <h3>Total a pagar: $ {values.total?.toLocaleString("es-MX") ?? "-"}</h3>
                            </div>
              <div class="form-group row">
                <label for="additional_comments" class="col-md-4 col-form-label"
                  >Observaciones:</label
                >
                <div class="col-md-8">
                  <textarea
                    class="form-control"
                    type="text"
                    bind:value={values.additional_comments}
                    id="additional_comments"
                  />
                </div>
              </div>

              <!-- <div class="form-group row">
                <label for="monthcost" class="col-md-4 col-form-label"
                  >Total recibido: $</label
                >
                <div class="col-md-6">
                  <input
                    class="form-control"
                    type="number"
                    bind:value={values.total}
                    id="total"
                  />
                </div> -->

                <!-- <button class="btn btn-primary waves-effect waves-light" type="button" on:click={() => Calculo(values.total)}>Previo pago </button>-->
              <!-- </div> -->
              <!-- <div class="form-group row">
                <label for="#select-patients" class="col-md-4 col-form-label"
                  >Pago adelantado:
                </label>
                <div class="col-md-8">${advancedpayment}</div>
              </div>
              {#if restante >= 0}
                <div class="form-group row">
                  <label for="#select-patients" class="col-md-4 col-form-label"
                    >Saldo a favor:
                  </label>
                  <div class="col-md-8">${restante}</div>
                </div>
              {:else if restante < 0}
                <div class="form-group row">
                  <div class="col-md-4 col-form-label">
                  
                  <label for="#select-patients" 
                    >Por pagar:
                  </label>
                </div>
                  <div class="col-md-8"><p>${restante}</p>
                    {#if pidses.length > 0 && 0 != values.total}
                    <div class="red" style="color: red;">POR POLITICAS NO SE ACEPTAN PAGOS PARCIALES EN LAS MENSUALIDADES</div>
                    {/if}
                  </div>
                </div>
              {/if} -->
              <!-- <table
                class="table table-striped table-bordered dt-responsive nowrap"
                style="border-collapse: collapse; border-spacing: 0; width: 100%;"
              >
                <thead>
                  <tr>
                    <th>Mes: </th>
                    <th>Costo mensual: </th>
                    <th>Pago</th>
                  </tr>
                </thead>

                <tbody>
                  {#each values.other as pagos}
                    <tr
                      style={pagos.paid === pagos.amount
                        ? "background-color:#B4D455"
                        : pagos.paid < pagos.amount
                          ? "background-color:#F7FBB4"
                          : ""}
                    >
                      <td>{pagos.concept}</td>
                      <td>${pagos.amount}</td>
                      <td>${pagos.paid}</td>
                    </tr>
                  {/each}
                </tbody>
              </table> -->
            </div>
          </div>
        </div>
      </div>
    </form>

    <div class="col-12">
      <div class="card p-4">
        <div class="flex flex-col">
            {#if error != "" }
            <small class="text-danger"
              ><b>{error}</b
            ></small>
            {/if}
            <div class="flex flex-row gap-4">
              <button
                type="button"
                on:click={updateData}
                class="btn btn-primary waves-effect waves-light"
                disabled={loading || values.total == 0 || !values.total || values.valid == false}
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
    </div>
    <!-- end col -->
  {:else}
    {#each Array(3) as recipe, i}
      <div class="col-12" style="border: 2px #000000 solid">
        <div class="card">
          <div class="card-body">
            <div class="recipt">
              <div class="" style="width: 100%;">
                <table style="width: 100%;">
                  <tr>
                    <td>
                      <div class="row mb-2">
                        <div class="col-9">
                          <div
                            style="font-size: 15px; color:#999; text-transform:uppercase;"
                          >
                            <BranchesSearchList
                              value={values.branch}
                              inlist={true}
                              withStyle={false}
                            />
                          </div>
                          <div
                            style="font-size: 55px; color:#666;font-weight:bold;line-height: 45px;"
                          >
                            <span style="line-height:45px;">RECIBO DE PAGO</span
                            >
                          </div>
                          <div
                            style="font-size: 13px; color:#666;font-weight:bold"
                          >
                            <span style="font-style:italic;font-weight:normal"
                              >fecha</span
                            >
                            {params.pids ? newprintdate : values.date}
                          </div>
                          <div style="font-size: 13px; color:#666;font-weight:bold">
                            <span style="font-style:italic;font-weight:normal">hora</span>
                            {#if values.added}
                              {new Date(values.added.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {:else}
                              {#await Promise.resolve(new Date()) then now}
                                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {/await}
                            {/if}
                          </div>
                        </div>
                        <!-- <div class="col-3" style="text-align:right;">
                          <img
                            src="assets/images/logoprint.png"
                            alt="los olivos"
                            height="120"
                          />
                        </div> -->
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div
                        class="row"
                        style="border-top:solid 1px #eaeaea; padding-top: 10px;"
                      >
                        <div class="col-6">
                          <div
                            style="font-size: 11px; color:#999; text-transform:uppercase;"
                          >
                            Nombre Residente
                          </div>
                          <div
                            style="font-size: 16px; color:#999; font-weight:bold"
                          >
                            {values.name}
                          </div>
                        </div>
                        <div class="col-6">
                          <div
                            style="font-size: 11px; color:#999; text-transform:uppercase;"
                          >
                            Familiar que hace el pago
                          </div>
                          <div
                            style="font-size: 16px; color:#999; font-weight:bold"
                          >
                            {values.familiarpay}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div
                  style="width: 100%; background-color:#ddd !important; padding:30px; margin-top:10px"
                  class="grey-table"
                >
                  <table
                    class="tabletable-bordered dt-responsive nowrap"
                    style="border-collapse: collapse; border-spacing: 0; width: 100%; color:#444"
                  >
                    <thead
                      style="border-bottom: solid 1px #999; color:#333; font-weight:bold"
                    >
                      <tr>
                        <th>CONCEPTO</th>
                        <th> </th>
                        <th>PAGO</th>
                      </tr>
                    </thead>

                    <tbody>
                      {#each values.concepts as pagos}
                        <tr>
                          <td>{concepts[pagos.concept] ?? "Pago"}

                            {#if pagos.concept == 2 || pagos.concept == 4}
                              {pagos.datePretty} 
                            {/if}
                          </td>
                          <td> </td>
                          <td
                            >{pagos.amount != null && pagos.amount !== "" 
                              ? Number(pagos.amount).toLocaleString("es-MX", { style: "currency", currency: "MXN" }) 
                              : "-"}
                          </td>
                        </tr>
                      {/each}
                      <tr>
                        <td><br /></td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr style="mt-2">
                        <td
                          style="font-size: 13px; color:#666;font-style:italic;font-weight:normal"
                          >Forma de pago: <b
                            >{#if values.paytype == 0}
                              Transferencia
                            {:else if values.paytype == 1}
                              Efectivo
                            {:else if values.paytype == 2}
                              Cheque
                            {/if}</b
                          ></td
                        >
                        <td>Total recibido</td>
                        <td>${values.total.toLocaleString("es-MX")}</td>
                      </tr>
                      {#if values.logs?.remainder > 0}
                        <tr>
                          <td></td>
                          <td>Saldo pendiente</td>
                          <td>${values.logs.remainder}</td>
                        </tr>
                      {/if}
                    </tbody>
                  </table>
                </div>

                {#if values.additional_comments}
                  <div
                    style="width: 100%; padding:30px; margin-top:10px"
                    class="table-grey"
                  >
                    <table
                      class="tabletable-bordered dt-responsive nowrap"
                      style="border-collapse: collapse; border-spacing: 0; width: 100%; color:#444"
                    >
                      <thead
                        style="border-bottom: solid 1px #999; color:#333; font-weight:bold"
                      >
                        <tr>
                          <th>Observaciones</th>
                        </tr>
                      </thead>

                      <tbody>
                          <tr>
                            <td>{values.additional_comments}</td>
                          </tr>
                      </tbody>
                    </table>
                  </div>
                {/if}

                <div class="row" style="padding-top: 10px;">
                  <div class="col-4">
                    <div
                      style="font-size: 11px; color:#999; text-transform:uppercase; text-align:center;"
                    >
                      Firma Familiar
                    </div>
                    <div
                      style="font-size: 16px; color:#999; font-weight:bold; height:50px; width:80%;margin: auto; border-bottom:solid 2px #999; "
                    ></div>
                  </div>
                  <div class="col-4">
                    <div
                      style="font-size: 11px; color:#999; text-transform:uppercase;text-align:center;"
                    >
                      Firma Recibido
                    </div>
                    <div
                      style="font-size: 16px; color:#999; font-weight:bold; height:50px; width:80%;margin: auto; border-bottom:solid 2px #999;"
                    ></div>
                  </div>
                  <div class="col-4">
                    <div
                      style="font-size: 11px; color:#999; text-transform:uppercase;text-align:center;"
                    >
                      Firma Oficina
                    </div>
                    <div
                      style="font-size: 16px; color:#999; font-weight:bold; height:50px; width:80%;margin: auto; border-bottom:solid 2px #999;"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="rotate">
                <div class="">
                  <span style="font-size: 20px; color:#666; font-weight:bold"
                    >Folio:</span
                  >
                  <span style="font-size: 20px; color:#666;font-weight:normal"
                    >{branchesfol}{values.folio}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr class="rounded" />
      <!-- end col -->
    {/each}

    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <button
            on:click={() => {
              printPayment();
            }}
            class="btn btn-primary waves-effect waves-light">Imprimir</button
          >
          <button
            on:click={() => window.location.href = "#/patient_payments/"}
            class="btn btn-secondary waves-effect waves-light ml-2">
            Volver a Pagos
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- end col -->
</div>

<style>
  hr.rounded {
    border-style: dashed;
    border-width: 2px;
    /* border-top: 2px solid #bbb; */
    /* border-radius: 5px; */
  }
  .recipt {
    position: relative;
    padding-right: 30px;
    page-break-inside: avoid;
  }
  .rotate {
    position: absolute;
    top: 130px;
    right: -48px;
    display: block;
    -webkit-transform: rotate(90deg);
    -moz-transform: rotate(90deg);
    padding: 5px;
  }
  @page {
    size: auto; /* auto is the initial value */
    /* this affects the margin in the printer settings */
    /* margin: 5px;   */
    font-size: 80%;
  }
  .table-grey {
    border: 10px solid #ddd; /* Define un borde sólido de 10px de grosor y color gris */
    padding: 20px; /* Añade un espacio de relleno al contenido dentro del div */
  }
</style>
