<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import {routes} from "../menu";
import {fun} from "../callable";

import RecordsTypeListSelect from "../controls/RecordsTypeListSelect.svelte"
import Activities_basicOptions from "../controls/Activities_basicOptions.svelte"
import Activities_generalOptions from "../controls/Activities_generalOptions.svelte"
import Activities_auxOptions from "../controls/Activities_auxOptions.svelte"
import ImageField from "../controls/ImageField.svelte";
import Activities_advancedOptions from "../controls/Activities_advancedOptions.svelte"
import Docs_containsOptions from "../controls/Docs_containsOptions.svelte"
import {partners} from "../controls/partners.js"
import PartnerSearchList from "../controls/PartnerSearchList.svelte"



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
    let records = [];
    let datatable;
    let unsubscribe;
    let loading = false;

    let filterName = params.field;
    let filterValue = params.value;

    const hasAdd = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addrecords") === 0;
        }).length > 0;
    const hasEdit = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editrecords/") === 0;
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
        datatable = jQuery('#records-dt').DataTable({
                lengthChange: false,
                buttons: ['copy', 'excel', 'pdf'],
                responsive: true,
                "scrollX": true
                
            });

            datatable.buttons().container()
                .appendTo('#records-dt_wrapper .col-md-6:eq(0)');
    }
	
    let query = db.collection("records");
    if(filterName != undefined && filterValue != undefined){
        console.log("filter : "+filterName+" == "+filterValue)
        query = query.where(filterName,"==",filterValue);
    }
    
    unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const temprecords = doc.data();
            temprecords.id = doc.id;
            tmp.push(temprecords);
            
        });
        records = tmp;
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
                    db.collection("records").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};

function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("records").doc(id).update(update);
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
    
    <TitleBar title="Expedientes" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title">Administración Expedientes</h4>
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={filterName} value={filterValue} />
                 {/if}
                 {#if hasAdd}
                <div class="row">
                    <div class="col"> </div>
                   
                    <div class="col-md-auto align-self-end">
                        <button on:click={function() { 
                            if(filterName != undefined && filterValue != undefined){
                                push('/addrecords/'+filterName+'/'+filterValue);
                            }else{
                                push('/addrecords');
                            }
                            
                        }} class="btn btn-primary waves-effect waves-light"><i class="bx bx-plus font-size-16 align-middle"></i> Agregar Expediente</button>
                    </div>
                  </div>
                {/if}
                <table id="records-dt" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                    <thead>
                        <tr>
                              
                            <th>Acciones</th>                   
                        </tr>
                    </thead>

                    <tbody>
                        
                        {#each records as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            
                            <td>
                                {#if hasEdit}
                                <a href="/editrecords/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
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