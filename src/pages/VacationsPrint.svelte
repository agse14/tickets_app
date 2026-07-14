<script>
    import { link } from "svelte-spa-router";
    import { pop } from "svelte-spa-router";
    import { fbuser} from "../stores.js";
    import TitleBar from "../TitleBar.svelte";
    import { onMount } from "svelte";
      
    import {workers} from "../controls/workers.js"
  import WorkersSearchList from "../controls/WorkersSearchList.svelte"
  
   function checkVisibles(){
  }
  
  
    export let params = {};
    export let values = {};
    export let autoAdd = false;
    export let buttons = true;
    export let onBack = ()=> {
      pop();
    }
    
    let old = {};
    let adder = {};
    let exists = false;
  
    let loading = true;
    let form;
  
    let filterName = params.field;
    let filterValue = params.value;

    let name;
    const today = DateTime.local().setLocale("es-mx").toISODate();
    
    const tempId = params.bid;
    if(filterName != undefined && filterValue != undefined){
          //console.log("filter : "+filterName+" == "+filterValue)
          values[filterName] = filterValue;
      }
    
  
    onMount(() => {
      form = document.getElementById('form');
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
        db.collection("vacations")
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
                if (values.workers) {
                    $workers.forEach(element => {
                        if(element.id == values.workers){
                            // console.log(element.name);
                            name = element.name;
                        }
                    })
                }    
            }
            loading = false;
          });
      }
    });
  
    function cancel() {
      onBack();
    }
  
    function updateData() {
      
      
      if(!form.checkValidity()){
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
      if(checkVisibles != undefined){
        checkVisibles();
      }
      loading = true;
      
      if (tempId != null) {
        //Actualizar si tiene id
        if(!exists){
          values.added = timenow;
          db.collection("vacations")
            .doc(tempId)
            .set(values)
            .then(function () {
              loading = false;
              onBack();
            });
        }else{
          values.edited = timenow;
          db.collection("vacations")
            .doc(tempId)
            .update(values)
            .then(function () {
              loading = false;
              onBack();
            });
        }
        
      } else {
        //Crear nuevo si no tiene
        values.added = timenow;
        values.createdBy = $fbuser.uid;
        values.createdName = $fbuser.displayName ?? '';
        db.collection("vacations")
          .add(values)
          .then(function () {
            loading = false;
            onBack();
          });
      }
    }
    function setField(field, value){
      values[field] = value;
      values = values;
    }
  
    function addToTable(field, adderValues){
      if(values[field] == undefined){
        values[field] = [];
      }
      values[field].push(adderValues);
      values = values;
      adder = {};
    }
    function deleteFromTable(field, idx){
      if(values[field] != undefined){
          values[field].splice(idx,1);
        }
        values = values;
    }
  
    function onAction(event){
      const action = event.detail;
      if(action == "save"){
        //console.log("saved");
        updateData();
      }
    }
    function openWin() {
        var divText = document.getElementById("printVoucher").outerHTML;
        var myWindow = window.open('','','width=1100,height=600');
        var doc = myWindow.document;
        doc.open();
        doc.write(divText);
        doc.close();
    }

    // console.log(values);
  </script>

<div class="page-content modal-body">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <button on:click={() => openWin() } class="btn btn-print waves-effect waves-light no-print"><i class="bx bx-printer font-size-16 align-middle mr-2"></i>Imprimir</button>
                </div>     
            </div>     
        </div>
    </div>     
    <form id="form">
        <div class="row">
            
    <div class="col-12">
        <div class="card">
    <div class="card-body" id="printVoucher" style="border: 2px #000000 solid; border-radius: 15px; padding: 20px;">
    
        <!-- <div class="form-group row"><label for="#select-workers" class="col-md-4 col-form-label">Nombre Empleado</label>
        <div class="col-md-8"><WorkersSearchList bind:value={values.workers}  />
        </div> </div> -->

        <table id='table' class="table-print table-striped print mb-4 mt-4">
            <thead>
                <tr>
                    <!-- <th scope="col"><WorkersSearchList bind:value={values.workers}/></th> -->
                    <th style="text-align: center; height: 40px" colspan="5">LOS OLIVOS ESTANCIAS SOLICITUD Y AUTORIZACION DE VACACIONES</th>
                    <!-- <th>PRECIO</th>
                    <th>IMPORTE</th>
                    <th class="no-print" colspan="2">Acciones</th> -->
                </tr>
            </thead>
            <tbody>
        
                <tr>
                <th scope="row" style="text-align: left; height: 40px" colspan="2">Nombre de la Empresa: LOS OLIVOS ESTANCIAS</th>
                <th scope="row" style="text-align: left; height: 40px" colspan="2">Area y/o departamento: {values.department}</th>
                </tr>
                <!-- <tr>
                <th colspan="4" scope="row" style="text-align: center; height:50%;"><br />COMPLEMENTOS</th>
                </tr> -->

                <tr>
                <th scope="row" style="text-align: left; height: 40px" colspan="2"># de Empleado: {values.workerNumber}</th>
                <th scope="row" style="text-align: left; height: 40px" colspan="2">Nombre del Empleado: {name}</th>
                </tr>
            
            
                <tr>
                    <th scope="row" style="text-align: left; height: 40px" colspan="2">Fecha de Ingreso: {values.admissionDate}</th>
                    <th scope="row" style="text-align: left; height: 40px" colspan="2">Años de servicio: {values.serviceYears}</th>
                </tr>
                <tr>
                    <th scope="row" style="text-align: left; height: 40px">Dias que corresponden: {values.assignedDays}</th>
                    <th scope="row" style="text-align: left; height: 40px">Dias a disfrutar: {values.takenDays}</th>
                    <th scope="row" style="text-align: left; height: 40px" colspan="2">Dias pendientes: {values.pendingDays}</th>
                </tr>
                <tr>
                    <th scope="row" style="text-align: left; height: 40px" colspan="2">Periodo a disfrutar desde: {values.periodStart}</th>
                    <th scope="row" style="text-align: left; height: 40px" colspan="2">Hasta: {values.periodEnd}</th>
                </tr>
                <tr>
                    <th scope="row" style="text-align: left; height: 40px" colspan="3">Fecha en que debera presentarse a trabajar: {values.returnDate}</th>
                </tr>
                <tr>
                    <th scope="row" style="text-align: left; height: 40px" colspan="3">Observaciones: {values.notes}</th>
                </tr>
                <tr>
                    <hr/>
                </tr>
                <tr>
                    <th scope="row" style="text-align: left; height: 40px" colspan="5">POR EL PRESENTE EXPRESO MI CONFORMIDAD DE SOLICITAR Y GOZAR MIS VACACIONES DE ACUERDO A LO QUE ESTABLECE EL ARTICULO 76 DE LA LEY FEDERAL DEL TRABAJO, CONSIDERANDO LOS SIGUIENTE DATOS</th>
                    <!-- <td></td>
                    <td colspan="2">Nombre y firma</td> -->
                </tr>
                <tr>
                    <th scope="row" style="text-align: right; height: 40px" colspan="5">MONTERREY, NUEVO LEON, A____________________</th>
                    <!-- <td></td>
                    <td colspan="2">Nombre y firma</td> -->
                </tr>
                <tr>
                    <td style="text-align: center; height: 40px">_________________________</td>
                    
                    <td style="text-align: center; height: 40px">_________________________</td>
                    
                    <td style="text-align: center; height: 40px">_________________________</td>
                </tr>
                <tr>
                    <td style="text-align: center; max-width: 40px; height: 40px">Firma de Conformidad del Empleado</td>
                    
                    <td style="text-align: center; max-width: 40px; height: 40px">Firma de Autorizacion del Gerente del Area y/o Director</td>
                    
                    <td style="text-align: center; max-width: 40px; height: 40px">Vo.Bo. jefe Inmediato</td>
                </tr>
            </tbody>
        </table>
    
    </div>
        </div>
    </div>
        </div>
    </form>
        
    </div>
  <style>
    th[scope=row]{
        padding: 0.75 rem !important; 
    }

    .table-print td, .table-print th[scope=row]{
        padding: 0.75 rem !important;
        vertical-align: top;
        /* border-top: 1px solid #eff2f7; */
        max-height: 40px;
    }

    /* .table-print {
        border: 2px #000000 solid;    
    } */
  </style>