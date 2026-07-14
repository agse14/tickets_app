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
    import BranchesSearchList from "../controls/BranchesSearchList.svelte"
import PatientSearchList from "../controls/PatientSearchList.svelte"

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
    .where("transit", "in", [0,2])
    .orderBy("added", "desc")
    .onSnapshot(async (querySnapshot) => {
        const tmp = [];

        // Usar Promise.all para esperar a que todas las consultas de branches se completen
        const paymentPromises = querySnapshot.docs.map(async (doc) => {
            const temppayments = doc.data();
            temppayments.id = doc.id;

            // Consulta la sucursal en la colección branches
            if (temppayments.branch) {
                const branchDoc = await db.collection("branches").doc(temppayments.branch).get();
                if (branchDoc.exists) {
                    const branchData = branchDoc.data();
                    // Combina el branches.folio con el folio de recipt_payments
                    temppayments.combinedFolio = `${branchData.folio}${temppayments.folio}`;
                } else {
                    // Si el branch no existe, se usa solo el folio de recipt_payments
                    temppayments.combinedFolio = `Unknown-${temppayments.folio}`;
                }
            } else {
                // Si branches no está definido, usa solo el folio de recipt_payments
                temppayments.combinedFolio = `NoBranch-${temppayments.folio}`;
            }

            tmp.push(temppayments);
        });

        await Promise.all(paymentPromises);
        guestpayments = tmp.sort((a, b) => b.added - a.added);
        // guestpayments = tmp;
        loading = false;

        console.log("guestpayments", guestpayments);
    });

  // db.collection("patients")
  //   .doc(tempId)
  //   .get()
  //   .then(function (query) {
  //     if (query == null || query == undefined || query.data() == null) {
  //       //No data crear
  //       //pop();
  //     } else {
  //       exists = true;
  //       patientdata = query.data();
  //       old = query.data();
  //       values.name = patientdata.name;
  //       values.monthcost = patientdata.monthcost;
  //       values.familiarpay = patientdata.responsible_name;
  //       values.nickname = patientdata.nickname;
  //       if (patientdata.paymentlogs == undefined) {
  //         patientdata.paymentlogs = [];
  //       }
  //       console.log("got patient", patientdata);

  //       // if(patientdata.paymentlogs != undefined) {
  //       //   Object.keys(patientdata.paymentlogs).forEach(element => {

  //       //                 values.paymentlogs.push(patientdata.paymentlogs[element]);

  //       //         });

  //       // }
  //       // console.log(values.paymentlogs);
  //     }

  //     loading = false;

  //     //console.log(patientdata.paymentlogs);
  //   });

  function recipt(payment) {
    console.log("recipt ", payment, patientdata);

    // db.collection("recipt_payments").doc(payment.id).update({transit:1});
    


    Swal.fire({
                title: "¿Esta seguro?",
                text: "Desea marcar el pago como recibido?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
                confirmButtonText: "Si, recibido!"
              }).then(function (result) {
                if (result.value) {
                  db.collection("recipt_payments").doc(payment.id).update({transit:1,transitdate:DateTime.local().toISODate()});
                    // db.collection("patients").doc(tempId).update({"paymentlogs":updatedLogs});
                    
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
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
            <h3>Pagos por recibir</h3>

            

            <table
              class="table table-striped table-bordered dt-responsive nowrap"
              style="border-collapse: collapse; border-spacing: 0; width: 100%;"
            >
              <thead>
                <tr>
                  <th>Fecha de pago </th>
                  <th>Folio</th>
                  <th>Origen</th>
                  <th>Paciente</th>
                  <th>Pagado por </th>
                  <th>Tipo de pago</th>
                  <th>Total recibido</th>
                  <th>Estatus</th>
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
                      <td>{pagos.combinedFolio}</td>
                      <td><BranchesSearchList value={pagos.branch} inlist={true}  /></td>
                      <td>
                        <PatientSearchList value={pagos.guestid} inlist={true}  /></td>
                      <td>
                        {pagos.familiarpay}
                        {#if pagos.concepts && pagos.concepts.length > 0}
                          <div style="font-size: 0.8em; color: #666;">
                            {#each pagos.concepts as concept}
                              {#if concept.concept == 1}
                                <small>Inscripcion</small><br />
                              {:else if concept.concept == 0}
                                <small>Separacion</small><br />
                              {:else if concept.concept == 2}
                                <small>Mensualidad - ({concept.datePretty})</small><br />
                              {/if}
                            {/each}
                          </div>
                        {/if}
                      </td>
                      <td>
                        {#if pagos.paytype == 0}
                          <span class="badge badge-success">Transferencia</span>
                        {:else if pagos.paytype == 1}
                          <span class="badge badge-info">Efectivo</span>         
                        {:else if pagos.paytype == 2}
                          <span class="badge badge-warning">Cheque</span>              
                        {/if}
                      </td>
                      <td>${pagos.total.toLocaleString("es-MX")}</td>
                      <td>
                        {#if pagos.transit == 0}
                          <span class="badge badge-success">Pagado</span>
                        {:else if pagos.transit == 1}
                          <span class="badge badge-danger">Recibido</span>
                        {:else if pagos.transit == 2}
                          <span class="badge badge-warning">En tránsito</span>
                        {/if}
                      </td>
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
                        on:click={() => recipt(pagos)}
                        class="btn btn-success waves-effect waves-light"
                        disabled={loading}
                        ><i
                          class="bx bx-check font-size-16 align-middle"
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
