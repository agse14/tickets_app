<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import {routes} from "../menu";
import {fun} from "../callable";
import WorkrolesEdit from "./WorkrolesEdit.svelte";

import {branches} from "../controls/branches.js"
import BranchesSearchList from "../controls/BranchesSearchList.svelte"
import {positions} from "../controls/positions.js"
import PositionsSearchList from "../controls/PositionsSearchList.svelte"



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
    
    let workroles = [];
    
    let datatable;
    let unsubscribe;
    let loading = false;
    let showModal = false;

    let filterName = params.field;
    let filterValue = params.value;

    let editData = {field:filterName, value:filterValue,bid:undefined};

    const hasAdd = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addworkroles") === 0;
        }).length > 0;
    const hasEdit = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editworkroles/") === 0;
        }).length > 0;
    
    onMount(() => {

    });
    onDestroy(() => {
        if(datatable != undefined && datatable != null){
            datatable.destroy();
        }
		if(unsubscribe != null && unsubscribe != undefined){
            unsubscribe();
        }
	});
    function loadData(){
        if(!loadDataTable){
            return;
        }
        datatable = jQuery('#workroles-dt').DataTable({
            lengthMenu: [
                [ 10, 25, 50, -1 ],
                [ '10 Roles de trabajo', '25 Roles de trabajo', '50 Roles de trabajo', 'Todo' ]
            ],
            data: workroles,
            columns: [
                { data: 'shift_night', render: function (data, type, row, meta) {
                    return data === true
                        ? 'Si'
                        : 'No';
                }, },
{ data: 'pay', render: function (data, type, row, meta) {
                    return '$ '+(data != undefined?data:'');
                }, },
{ data: 'positionsName' },
{ data: 'id', render: function (data, type, row, meta) {
					let buttons = "";
					if(hasEdit){
						if(modal){
							buttons += '<button type="button" class="btn btn-light waves-effect" onclick="setEditId(\''+data+'\');"><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>';
						}else{
							buttons += '<a href="/editroom_inventory/'+data+'" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
						}
					}

                    return  buttons+'<button onclick="deleteDoc(\''+data+'\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>';
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
                .appendTo('#workroles-dt_wrapper .col-md-6:eq(0)');
    }
	
    let query = db.collection("workroles");
    if(filterName != undefined && filterValue != undefined){
        console.log("filter : "+filterName+" == "+filterValue)
        query = query.where(filterName,"==",filterValue);
    }
    
    unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const tempworkroles = doc.data();
            tempworkroles.id = doc.id;
            			$branches.forEach(element => {
                if(element.id == tempworkroles.branches){
                  tempworkroles.branchesName = element.name;
                }
              });
			$positions.forEach(element => {
                if(element.id == tempworkroles.positions){
                  tempworkroles.positionsName = element.name;
                }
              });

            tmp.push(tempworkroles);
            
            
        });
        workroles = tmp;
        await tick();
        if(datatable == undefined){
            
            loadData();
        }else{
            //datatable.clear();
            datatable.clear();
            datatable.rows.add(workroles).draw(false);
        }
        // if(datatable != undefined){
        //     datatable.rows('dom').invalidate().draw(false);
        // }
        
        
    });

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
                    db.collection("workroles").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};


function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("workroles").doc(id).update(update);
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
    
    <TitleBar title="Roles de trabajo" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                
                <h4 class="card-title">Administración Roles de trabajo</h4>
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={filterName} value={filterValue} />
                 {/if}
                 {#if hasAdd}
                <div class="row">
                    <div class="col"> </div>
                   
                    <div class="col-md-auto align-self-end">
                        {#if modal}
                        <button type="button" class="btn btn-primary waves-effect waves-light" on:click={()=>{ setEditId(undefined);}}>Agregar Puesto en sucursal</button>
                        {:else}
                        <button on:click={function() { 
                            if(filterName != undefined && filterValue != undefined){
                                push('/addworkroles/'+filterName+'/'+filterValue);
                            }else{
                                push('/addworkroles');
                            }
                            
                        }} class="btn btn-primary waves-effect waves-light"><i class="bx bx-plus font-size-16 align-middle"></i> Agregar Puesto en sucursal</button>
                        {/if}
                    </div>
                  </div>
                {/if}
                
                <table id="workroles-dt" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th>Disponible de noche</th>
                            <th>Sueldo</th>
                            <th>Puesto</th>
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
                                <h5 class="modal-title mt-0" id="editModalScrollableTitle">Agregar Puesto en sucursal</h5>
                                <button type="button" class="close" on:click={()=>{
                                    editData = {field:filterName, value:filterValue,bid:undefined};
                                    jQuery('#editModalScrollable').modal('hide');
                                    showModal = false;
                                }} aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            {#if showModal}
                                <WorkrolesEdit params={editData} onBack={()=>{
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
    {#each workroles as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            <td>{row.shift_night?'Si':'No'}</td>
{ data: 'pay', render: function (data, type, row, meta) {
                    return '$ '+(data != undefined?data:'');
                }, },
<td><h5>{row.positionsName}</h5></td>

                            <td>
                                {#if hasEdit}
                                    {#if modal}
                                    <button type="button" class="btn btn-light waves-effect" on:click={()=>{ setEditId(row.id);}}><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>
                                    {:else}
                                     <a href="/editworkroles/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                                    {/if}
                                {/if}
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>
                            </td>
                        </tr>
                        {/each}
-->