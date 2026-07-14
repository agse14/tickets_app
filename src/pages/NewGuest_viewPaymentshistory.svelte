<script>
  import { link } from "svelte-spa-router";
  import { pop, push } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount, onDestroy } from "svelte";
  import { patients } from "../controls/patients.js";
  import PatientsSearchList from "../controls/PatientsSearchList.svelte";
  import PaytypeSelect from "../controls/PaytypeSelect.svelte";
  import PaymentsEdit from "./PaymentsEdit.svelte";
  import { permissions, profile } from "../stores.js";
    import { each } from "svelte/internal";
    import { concepts} from "../Utils/payments.js";

  export let params = {};
  export let values = {};
  export let autoAdd = false;

  let old = {};
  let adder = {};
  let exists = false;

  let patientdata = {};
  let patientpayments;

  values.paymentlogs = [];

  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;

  const temppids = params.pids;

  const tempId = params.bid;

  let restante = 0;

  let payments = {};

  let today = DateTime.local()
    .setLocale("es-mx")
    .toLocaleString(DateTime.DATE_FULL);
  let advancedpayment = 0;
  let adeudo = 0;
  values.total = 0;

  values.other = [];

  values.date = today;

  values.paydate = DateTime.local().setLocale("es-mx").toISODate();

  values.guestid = tempId;

  $: values, patientdata;

  let paymenteditID;

  let paymentlogs;

  let paymentUpdate = {};

  let guestpayments = [];
  let unsubscribe;

  // revisar si es undefined, hacerle spli por , por cada pid se genera un other en values push al other agregar un input a la tabla para la cantidad a pagar
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
  });
  onDestroy(() => {
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
        }
    });

  function cancel() {
    pop();
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
    loading = true;
    // TODO: hace transacion para el folio
    values.added = timenow;

    db.collection("guest_payments")
      .doc(paymenteditID)
      .update(paymentUpdate)
      .then(function () {
        loading = false;
        //pop();
      });

    if (tempId != null) {
      //Actualizar si tiene id

      values.edited = timenow;
      console.log(tempId);
      paymentlogs = patientdata.paymentlogs;

      db.collection("patients")
        .doc(tempId)
        .update("paymentlogs", paymentlogs) // cambia porq hay q guardar el payments
        .then(function () {
          loading = false;
          //pop();
        });
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("patients")
        .add(paymentlogs)
        .then(function () {
          loading = false;
          //pop();
        });
    }
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
    adder = {};
  }
  function deleteFromTable(field, idx) {
    if (values[field] != undefined) {
      values[field].splice(idx, 1);
    }
    values = values;
  }

  unsubscribe = db.collection("recipt_payments")
    .where("guestid", "==", tempId)
    .orderBy("paydate","desc")
    .onSnapshot((querySnapshot) => {
      const tmp = [];

      querySnapshot.forEach((doc) => {
        //  console.log(`${doc.id} => ${doc.data()}`);
        const temppayments = doc.data();
        temppayments.id = doc.id;
        tmp.push(temppayments);
      });
      guestpayments = tmp;

      console.log("guestpayments", guestpayments);
    });

  db.collection("patients")
    .doc(tempId)
    .get()
    .then(function (query) {
      if (query == null || query == undefined || query.data() == null) {
        //No data crear
        //pop();
      } else {
        exists = true;
        patientdata = query.data();
        old = query.data();
        values.name = patientdata.name;
        values.monthcost = patientdata.monthcost;
        values.familiarpay = patientdata.responsible_name;
        values.nickname = patientdata.nickname;
        if (patientdata.paymentlogs == undefined) {
          patientdata.paymentlogs = [];
        }
        console.log("got patient", patientdata);

        // if(patientdata.paymentlogs != undefined) {
        //   Object.keys(patientdata.paymentlogs).forEach(element => {

        //                 values.paymentlogs.push(patientdata.paymentlogs[element]);

        //         });

        // }
        // console.log(values.paymentlogs);
      }

      loading = false;

      //console.log(patientdata.paymentlogs);
    });

  function deletepayment(payment) {
    console.log("deletig ", payment, patientdata);

    //db.collection("guest_payments").doc(payment.id).delete();
    // if(patientdata.paymentlogs == undefined ||  patientdata.paymentlogs == {} || payment.logs.paymentlogs == undefined ||  payment.logs.paymentlogs == {}){
    //   Swal.fire("Error", "Discrepancia en los registros, favor de notificar al administrador.", "error");
    //   return;
    // }
    // let delDate;
    // Object.keys(payment.payments).forEach(date => {
    //   delDate = date;
    // });

    // var updatedLogs = patientdata.paymentlogs;
    // Object.keys(payment.logs.paymentlogs).forEach(pid => {
    //   console.log(pid);
    //   console.log(updatedLogs[pid]);
    //   // return;
    //   if (delDate == pid) {
    //     console.log(updatedLogs[pid]);
    //     // return;
    //     delete updatedLogs[pid];
    //   }
    //   // delete updatedLogs[pid];
    //   // console.log(updatedLogs );
    // });


    Swal.fire({
                title: "¿Esta seguro?",
                text: "Desea eliminar este pago",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
                confirmButtonText: "Si, borrarlo!"
              }).then(async function (result) {
                if (result.value) {
                  let delPayment = await db.collection("recipt_payments").doc(payment.id).get(); 
                  let delPaymentData = delPayment.data();
                  delPaymentData.deletedOn = new Date();
                  delPaymentData.deletedBy = profile?.name ?? "";
                  db.collection("recipt_payments_log").doc(payment.id).set(delPaymentData);//update({paydate:firebase.firestore.FieldValue.delete()});//.delete();

                    // db.collection("patients").doc(tempId).update({"paymentlogs":updatedLogs});
                  db.collection("recipt_payments").doc(payment.id).delete();//update({paydate:firebase.firestore.FieldValue.delete()});//.delete();

                    // db.collection("patients").doc(tempId).update({"paymentlogs":updatedLogs});
                    
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    // function isDate(date) {
    //   return date.dateId === dateId;
    // }

    // let dI = values.paymentlogs.indexOf(values.paymentlogs.find(isDate));

    // values.paymentlogs.splice(dI, 1);

    // values.paymentlogs = values.paymentlogs;
    // delete patientdata.paymentlogs[dateId];

    // for (let i = 0; i < guestpayments.length; i++) {
    //   // console.log(guestpayments[i].logs.paymentlogs);
    //   Object.keys(guestpayments[i].logs.paymentlogs).forEach((element) => {
    //     //console.log("okeys",element);
    //     if (guestpayments[i].logs.paymentlogs[element].dateId === dateId) {
    //       guestpayments[i].logs.paymentlogs[element].note = "Pago cancelado";
    //       paymenteditID = guestpayments[i].id;
    //       paymentUpdate = guestpayments[i];
    //     }
    //   });

    //   //console.log(paymentUpdate);
    // }

    
    // console.log(dateId);
    //console.log(paymentlogs);
    // console.log(values.paymentlogs);

    //refereciar el id del px

    //referenciar el id del log
  }

  function viewpayment(pId){
      push('/recipt_payments/'+pId);

    }

</script>

<div class="page-content">
  <TitleBar title="Agregar Pago huesped" base="Inventario" />

  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h3>Historial de pagos:</h3>
            <div class="form-group row">
              <label for="#select-patients" class="col-md-4 col-form-label"
                >Nombre Residente:
              </label>
              <div class="col-md-8">{patientdata.name}</div>
            </div>

            <div class="form-group row">
              <label for="name" class="col-md-4 col-form-label"
                >Nombre corto:
              </label>
              <div class="col-md-8">
                {patientdata.nickname}
              </div>
            </div>

            <div class="form-group row">
              <label for="entrydate" class="col-md-4 col-form-label"
                >Fecha:</label
              >
              <div class="col-md-2">{today}</div>
            </div>

            <table
              class="table table-striped table-bordered dt-responsive nowrap"
              style="border-collapse: collapse; border-spacing: 0; width: 100%;"
            >
              <thead>
                <tr>
                  <th>Fecha de pago </th>
                  <th>Pagado por </th>
                  <th>Conceptos Pagados </th>
                  <th>Total recibido</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {#if guestpayments != undefined}
                  {#each guestpayments as pagos}
                    <tr>
                      <td><span title="{pagos.id}" on:click={()=>{
                        navigator.clipboard.writeText(pagos.id);
                      }}>{pagos.date}</span></td>
                      <td>{pagos.familiarpay}</td>
                      <td>
                        <ul>
                          {#each pagos.concepts as concept}
                            <li style="white-space:nowrap;">
                              {concepts[concept.concept] ?? "Pago "} {concept.datePretty ?? ""}: 
                              {concept.amount != null
                                ? concept.amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                                : "-"}
                            </li>
                          {/each}
                        </ul>
                      <td>${pagos.total.toLocaleString("es-MX")}</td>
                      <td>
                        
                          <a href="#/recipt_payments/{pagos.id}" target="_blank" rel="noopener noreferrer"
                            class="btn btn-info waves-effect waves-light"
                            ><i
                              class="bx bx-show-alt font-size-16 align-middle"
                            /></a
                          >
                         
                        {#if $permissions.admin || $permissions.accounting}
                        <button
                        type="button"
                        on:click={() => deletepayment(pagos)}
                        class="btn btn-danger waves-effect waves-light"
                        disabled={loading}
                        ><i
                          class="bx bx-x font-size-16 align-middle"
                        /></button
                      >{/if}
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </form>

  <div class="col-12">
    <div class="card">
      <div class="card-body">
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

  <!-- end col -->
</div>

<style>
  hr.rounded {
    border-top: 8px solid #bbb;
    border-radius: 5px;
  }
  .initcap {
    text-transform: capitalize;
  }
</style>
