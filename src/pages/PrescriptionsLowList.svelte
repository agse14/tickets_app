<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
//import {routes} from "../menu";
import {fun} from "../callable";
import { permissions, profile} from "../stores.js";
import PrescriptionsEdit from "./PrescriptionsEdit.svelte";

import { dosis_unit as prescriptions_dosis_unit} from "../controls/prescriptions.js"
import { frequency as prescriptions_frequency} from "../controls/prescriptions.js"
import {patients} from "../controls/patients.js"
import PatientsSearchList from "../controls/PatientsSearchList.svelte"
import FrecuencyCtrl from "../controls/FrecuencyCtrl.svelte"
import PeriodOptions from "../controls/PeriodOptions.svelte"
import { via as prescriptions_via} from "../controls/prescriptions.js"

 function checkVisibles(){
}


import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	const [send, receive] = crossfade({
		duration: d => Math.sqrt(d * 200),

		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
    });
    

    export let params = {};
    export let loadDataTable = true;
    export let modal = true;
    //array [0 = doc field, 1=profile field]
    export let profileFilter = null;
    export let hasAdd = true;
    export let hasEdit = true;
    
    let prescriptions = [];
    
    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let loading = false;
    let showModal = false;

    let filterName = params.field;
    let filterValue = params.value;

    let editData = {field:filterName, value:filterValue,bid:undefined};

    onDestroy(() => {
        if(datatable != undefined && datatable != null){
            datatable.clear();
            datatable.destroy();
            datatable = undefined;
        }
		if(unsubscribe != null && unsubscribe != undefined){
            unsubscribe();
            unsubscribe = undefined;
        }
	});

    if(profileFilter !== null){
        unsubscribeProfile = profile.subscribe(value => {
            if(value == undefined && !$permissions.admin){
                console.log("no profile");
                return;
            }
            if(!$permissions.admin && !$permissions.prescriptions){
                console.log("not admin",value);

                filterName = profileFilter[0];
                filterValue = value != undefined ? (value[profileFilter[1]] ?? ''):'';
            }
            // else{
            //     hasEdit = true;
            // }
            loadFirebaseData();
        });
    }else{
        loadFirebaseData();
    }
    function loadData(){
        if(!loadDataTable){
            return;
        }
        datatable = jQuery('#prescriptionslow-dt').DataTable({
            lengthMenu: [
                [ 10, 25, 50, -1 ],
                [ '10 Prescripción', '25 Prescripción', '50 Prescripción', 'Todo' ]
            ],
            data: prescriptions,
            createdRow: function (row, data, index) {
                
            },
            columns: [
                { data: 'name', name:'Medicamento', render: function (data, type, row, meta) {
					var id = "";
                    if(row != undefined) id = row.id;
					if(type.cells != undefined){
						id = type.cells[type.cells.length-1].data;
					}
                    return html('<a href="#/editprescriptions/'+id+'">'+data+'</a>');
                }, },
{ data: 'viaName', name:'Via de administración' },
{ data: 'amount', render: function (data, type, row, meta) {
                    return ''+(data != undefined?data:'');
                }, },
{ data: 'dosis_unitName', name:'Unidades' },
{ data: 'frequencyName', name:'Administrar durante' },
{ data: 'observations', render: function (data, type, row, meta) {
                    return ''+(data != undefined?data:'');
                }, },
{ data: 'inventory', render: function (data, type, row, meta) {
                    return ''+(data != undefined?data:'');
                }, },
{ data: 'btn_add', name:'Agregar a inventario', render: function (data, type, row, meta) {
                    return '<a href="#'+"/adddrug_inventory/prescriptions/"+row.id+'" class="btn btn-light waves-effect">Agregar a inventario</a>';
                }, },
{ data: 'did', name:'Acciones', render: function (data, type, row, meta) {
					let buttons = "";
					if(hasEdit){
						if(modal){
							buttons += '<button type="button" class="btn btn-light waves-effect" onclick="setEditId(\''+data+'\');"><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>';
						}else{
							buttons += '<a href="#/editprescriptions/'+data+'" class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
						}
					}

                    return html( buttons+'<button onclick="deleteDoc(\''+data+'\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button>');
                }, },

            ],
            "language": {
                "lengthMenu": "Ver _MENU_",
                "info": "Mostrando _PAGE_ de _PAGES_ páginas",
                "search":  "Buscar:",
                "paginate": {
                    "first":      "Primero",
                    "last":       "Último",
                    "next":       "Siguiente",
                    "previous":   "Anterior"
                },
            },
                buttons: ['copy', 'excel', 'pdf'],
                responsive: true,
                "scrollX": true
                
            });

            datatable.buttons().container()
                .appendTo('#prescriptionslow-dt_wrapper .col-md-6:eq(0)');
    }
	function loadFirebaseData(){
        let query = db.collection("prescriptions");
        if(filterName != undefined && filterValue != undefined){
            console.log("filter : "+filterName+" == "+filterValue)
            query = query.where(filterName,"==",filterValue);
        }
        
        unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempprescriptions = doc.data();
                tempprescriptions.id = doc.id;
                tempprescriptions.did = doc.id;
                
                			
				tempprescriptions.patientsName = "";
				$patients.forEach(element => {
                if(element.id == tempprescriptions.patients){
                  tempprescriptions.patientsName = element.name;
                }
              });
tempprescriptions.viaName = (tempprescriptions.via != undefined && prescriptions_via[tempprescriptions.via] != undefined) ? prescriptions_via[tempprescriptions.via] : '';
tempprescriptions.dosis_unitName = (tempprescriptions.dosis_unit != undefined && prescriptions_dosis_unit[tempprescriptions.dosis_unit] != undefined) ? prescriptions_dosis_unit[tempprescriptions.dosis_unit] : '';
tempprescriptions.frequencyName = (tempprescriptions.frequency != undefined && prescriptions_frequency[tempprescriptions.frequency] != undefined) ? prescriptions_frequency[tempprescriptions.frequency] : '';
                if(tempprescriptions.inventory < 4){
                    tmp.push(tempprescriptions);
                }
                
                
                
            });
            prescriptions = tmp;
            await tick();
            if(datatable == undefined){
                
                loadData();
            }else{
                datatable.clear();
                datatable.rows.add(prescriptions).draw(false);
            }
            // if(datatable != undefined){
            //     datatable.rows('dom').invalidate().draw(false);
            // }
            
            
        });
    }
    
function html(data){
    return data;
}
function setEditId(eId) {
    editData = {field:filterName, value:filterValue,bid:eId};
    showModal = true;
    jQuery('#editModalScrollable').modal('show');
    
}

function deleteDoc(id) {
    Swal.fire({
                title: "¿Esta seguro?",
                text: "Desea eliminar este registro",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
                confirmButtonText: "Si, borrarlo!"
              }).then(function (result) {
                if (result.value) {
                    db.collection("prescriptions").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};


function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("prescriptions").doc(id).update(update);
}
window.setEditId = setEditId;
window.deleteDoc = deleteDoc;
window.asyncChange = asyncChange;

function timeToAgo(timeStr){
    if(timeStr == undefined || timeStr == "" || timeStr == null){
        return "";
    }
    if(timeStr instanceof firebase.firestore.Timestamp){
        return DateTime.fromJSDate(timeStr.toDate()).setLocale("es-mx").toRelative({ days: 1 });
    }
    return DateTime.fromISO(timeStr).setLocale("es-mx").toRelative({ days: 1 });
}
function timeFormated(timeStr){
    if(timeStr == undefined || timeStr == "" || timeStr == null){
        return "";
    }
    if(timeStr instanceof firebase.firestore.Timestamp){
        return DateTime.fromJSDate(timeStr.toDate()).setLocale("es-mx").toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
    }
    return DateTime.fromISO(timeStr).setLocale("es-mx").toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
}

function runFunction(fid, params){
    if(typeof fun[fid] ==='function'){ 
        loading = true;
        fun[fid](params).then((result) => {
            // Read result of the Cloud Function.
            var sanitizedMessage = result.data.text;
            loading = false;
        })
        .catch((error) => {
        loading = false;
            // Getting the Error details.
            var code = error.code;
            var message = error.message;
            var details = error.details;
            Swal.fire({
                        title: "Error",
                        text: message,
                        type: "warning",
                        cancelButtonColor: "#f46a6a",
                    });
        });;
    }
}
</script>

    

<div class="page-content">
    
    <TitleBar title="Prescripción" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                
                <h4 class="card-title">Inventarios bajos</h4>
                 
                <table id="prescriptionslow-dt" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th>Medicamento</th>
<th>Via de administración</th>
<th>Cantidad a administrar</th>
<th>Unidades</th>
<th>Administrar durante</th>
<th>Observaciones</th>
<th>Dosis en el inventario</th>
<th>Agregar a inventario</th>  
                            <th>Acciones</th>                   
                        </tr>
                    </thead>

                    <tbody>
                        
                    </tbody>
                </table>
                
                <div class="modal fade" id="editModalScrollable" tabindex="-1" role="dialog" aria-labelledby="editModalScrollableTitle" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title mt-0" id="editModalScrollableTitle">Agregar Prescripciones</h5>
                                <button type="button" class="close" on:click={()=>{
                                    editData = {field:filterName, value:filterValue,bid:undefined};
                                    jQuery('#editModalScrollable').modal('hide');
                                    showModal = false;
                                }} aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            {#if showModal}
                                <PrescriptionsEdit params={editData} onBack={()=>{
                                    editData = {field:filterName, value:filterValue,bid:undefined};
                                    jQuery('#editModalScrollable').modal('hide');
                                    showModal = false;
                                }}/>
                            {/if}
                        </div>
                        <!-- /.modal-content -->
                    </div>
                    <!-- /.modal-dialog -->
                </div>

            </div>
        </div>
    </div>
    <!-- end col -->
</div>
<!-- end row -->
</div>

<!--
    {#each prescriptions as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            <td><a href="/editprescriptions/{row.id}" use:link>{row.name}</a></td>
<td><PrescriptionsViaListSelect value={row.via} inlist={true} /></td>
{ data: 'amount', render: function (data, type, row, meta) {
                    return ''+(data != undefined?data:'');
                }, },
<td><PrescriptionsDosis_unitListSelect value={row.dosis_unit} inlist={true} /></td>
<td><PrescriptionsFrequencyListSelect value={row.frequency} inlist={true} /></td>
{ data: 'observations', render: function (data, type, row, meta) {
                    return ''+(data != undefined?data:'');
                }, },
{ data: 'inventory', render: function (data, type, row, meta) {
                    return ''+(data != undefined?data:'');
                }, },
<td><a use:link={"/adddrug_inventory/prescriptions/"+row.id} class="btn btn-light waves-effect">Agregar a inventario</a></td>

                            <td>
                                {#if hasEdit}
                                    {#if modal}
                                    <button type="button" class="btn btn-light waves-effect" on:click={()=>{ setEditId(row.id);}}><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>
                                    {:else}
                                     <a href="/editprescriptions/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                                    {/if}
                                {/if}
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>
                            </td>
                        </tr>
                        {/each}
-->