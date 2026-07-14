<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import {routes} from "../menu";
import {fun} from "../callable";

import EquipmentsalesRental_typeListSelect from "../controls/EquipmentsalesRental_typeListSelect.svelte"
import {equipment} from "../controls/equipment.js"
import EquipmentSearchList from "../controls/EquipmentSearchList.svelte"
import {equipmentsalesmen} from "../controls/equipmentsalesmen.js"
import EquipmentsalesmenSearchList from "../controls/EquipmentsalesmenSearchList.svelte"
import EquipmentsalesClient_typeListSelect from "../controls/EquipmentsalesClient_typeListSelect.svelte"
import EquipmentsalesStatus from "../controls/EquipmentsalesStatus.svelte"
import {equipmentdriver} from "../controls/equipmentdriver.js"
import EquipmentdriverSearchList from "../controls/EquipmentdriverSearchList.svelte"
import ImageField from "../controls/ImageField.svelte";



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
    let equipmentsales = [];
    let datatable;
    let unsubscribe;
    let loading = false;

    let filterName = params.field;
    let filterValue = params.value;

    const hasAdd = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addequipmentsales") === 0;
        }).length > 0;
    const hasEdit = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editequipmentsales/") === 0;
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
        datatable = jQuery('#equipmentsales-dt').DataTable({
                lengthChange: false,
                buttons: ['copy', 'excel', 'pdf'],
                responsive: true,
                "scrollX": true
                ,"order": [[ 2, "desc" ]]
            });

            datatable.buttons().container()
                .appendTo('#equipmentsales-dt_wrapper .col-md-6:eq(0)');
    }
	
    let query = db.collection("equipmentsales");
    if(filterName != undefined && filterValue != undefined){
        console.log("filter : "+filterName+" == "+filterValue)
        query = query.where(filterName,"==",filterValue);
    }
    
    unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const tempequipmentsales = doc.data();
            tempequipmentsales.id = doc.id;
            tmp.push(tempequipmentsales);
            
        });
        equipmentsales = tmp;
        await tick();
        if(datatable == undefined){
            
            loadData();
        }else{
            //datatable.clear();
        }

        datatable.rows('dom').invalidate().draw(false);
    });



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
                    db.collection("equipmentsales").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};

function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("equipmentsales").doc(id).update(update);
}
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
    
    <TitleBar title="Ventas/Rentas" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title">Administración Ventas/Rentas</h4>
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={filterName} value={filterValue} />
                 {/if}
                 {#if hasAdd}
                <div class="row">
                    <div class="col"> </div>
                   
                    <div class="col-md-auto align-self-end">
                        <button on:click={function() { 
                            if(filterName != undefined && filterValue != undefined){
                                push('/addequipmentsales/'+filterName+'/'+filterValue);
                            }else{
                                push('/addequipmentsales');
                            }
                            
                        }} class="btn btn-primary waves-effect waves-light"><i class="bx bx-plus font-size-16 align-middle"></i> Agregar Venta/Renta</button>
                    </div>
                  </div>
                {/if}
                <table id="equipmentsales-dt" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th>Equipo</th>
<th>Folio</th>
<th>Estatus de la Renta</th>
<th>Fecha Inicio</th>
<th>Fecha Fin</th>
<th>Nombre del cliente</th>
<th>Procesos</th>  
                            <th>Acciones</th>                   
                        </tr>
                    </thead>

                    <tbody>
                        
                        {#each equipmentsales as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            <td><EquipmentSearchList value={row.equipment} inlist={true} /></td>
<td>{row.folio != undefined ? row.folio:''}</td>
<td><EquipmentsalesStatus value={row.status} data={row} inlist={true} /></td>
<td>{row.start}</td>
<td>{timeToAgo(row.end)}<br /><small>{timeFormated(row.end)}</small></td>
<td><a href="/editequipmentsales/{row.id}" use:link>{row.name}</a></td>
<td>{#if row.status == 0 || row.status == 2}<button on:click={()=>{ runFunction("deliverEquipment",{eid:row.id, accept:"true"}); }} class="btn btn-success waves-effect" disabled={loading}>Entregado</button>{/if}</td>

                            <td>
                                {#if hasEdit}
                                <a href="/editequipmentsales/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                                {/if}
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>
                            </td>
                        </tr>
                        {/each}
                       
                    </tbody>
                </table>
                
            </div>
        </div>
    </div>
    <!-- end col -->
</div>
<!-- end row -->
</div>