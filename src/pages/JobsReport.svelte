<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
//import {routes} from "../menu";
import {fun} from "../callable";
import { permissions, profile} from "../stores.js";
import JobsEdit from "./JobsEdit.svelte";
import {fbuser} from "../stores.js";
import {branches} from "../controls/branches.js"
import JobsHead from "../controls/JobsHead.svelte"
import BranchesSearchList from "../controls/BranchesSearchList.svelte"
import {positions} from "../controls/positions.js"
import PositionsSearchList from "../controls/PositionsSearchList.svelte"
import {workers} from "../controls/workers.js"
import WorkersSearchList from "../controls/WorkersSearchList.svelte"

 function checkVisibles(){
}


import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
    import Speedometer from '../controls/Speedometer.svelte';

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
    
    let workabsences = [];
    let workabsencesMonth = [];
    let activePartners = 0;
    let newInMonth = 0;
    let outInMonth = 0;
    let irp = 0;
    let newLast = 0;
    let outLast = 0;
    let irpLast = 0;
    let retentionIndex = 0;
    let retentionIndexLast = 0;
    let thisMonth = DateTime.local();
    let lastMonth = DateTime.local().minus({months:1});
    let hiringTime = 0;
    let hiringTimeLast = 0;
    let hires = 0;
    
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
            if(!$permissions.admin && !$permissions.workabsences){
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
    
	async function loadFirebaseData() {
        let query = db.collection("jobs");
        
        if (filterName != undefined && filterValue != undefined) {
            console.log("filter : " + filterName + " == " + filterValue);
            query = query.where(filterName, "==", filterValue);
        }

        // Variables de seguimiento
        hiringTime = 0;
        hiringTimeLast = 0;
        hires = 0;

        unsubscribe = query.orderBy('added', 'desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                const tempWorkAbsence = doc.data();
                tempWorkAbsence.id = doc.id;
                tempWorkAbsence.did = doc.id;

                // Obtener el nombre de la sucursal
                tempWorkAbsence.branchesName = "";
                $branches.forEach(branch => {
                    if (branch.id == tempWorkAbsence.branches) {
                        tempWorkAbsence.branchesName = branch.name;
                    }
                });

                // Obtener el nombre de la posición
                tempWorkAbsence.positionsName = "";
                $positions.forEach(position => {
                    if (position.id == tempWorkAbsence.positions) {
                        tempWorkAbsence.positionsName = position.name;
                    }
                });

                // Convertir las fechas a formato legible
                if (tempWorkAbsence.added != undefined) {
                    tempWorkAbsence.addedDate = DateTime.fromJSDate(tempWorkAbsence.added.toDate()).setLocale("es-mx");
                }
                if (tempWorkAbsence.ended != undefined) {
                    tempWorkAbsence.endedDate = DateTime.fromJSDate(tempWorkAbsence.ended.toDate()).setLocale("es-mx");
                }

                tmp.push(tempWorkAbsence);
            });

            workabsences = tmp;

            // Filtrar datos por mes actual y mes pasado
            workabsencesMonth = workabsences.filter(element => {
                const date = DateTime.fromJSDate(element.added.toDate());
                return date.month == thisMonth.month && date.year == thisMonth.year;
            });

            let workabsencesLast = workabsences.filter(element => {
                const date = DateTime.fromJSDate(element.added.toDate());
                return date.month == lastMonth.month && date.year == lastMonth.year;
            });

            // Calcular tiempos de contratación
            let hiringTotal = 0;

            workabsencesMonth.forEach(element => {
                if (element.ended != undefined) {
                    const date = DateTime.fromJSDate(element.ended.toDate());
                    hiringTotal += date.diff(element.addedDate).as('days');
                    hires++;
                }
            });

            hiringTime = isNaN(hiringTotal / workabsencesMonth.length) ? 0 : Math.floor(hiringTotal / workabsencesMonth.length * 100) / 100;

            hiringTotal = 0;
            workabsencesLast.forEach(element => {
                if (element.ended != undefined) {
                    const date = DateTime.fromJSDate(element.ended.toDate());
                    hiringTotal += date.diff(element.addedDate).as('days');
                }
            });

            hiringTimeLast = isNaN(hiringTotal / workabsencesLast.length) ? 0 : Math.floor(hiringTotal / workabsencesLast.length * 100) / 100;
        });

        let dataPartners = await db.collection("partners").where("inbranch", "==", true).get();
        
        // Variables de seguimiento de partners
        irp = 0;
        newInMonth = 0;
        outInMonth = 0;

        dataPartners.docs.forEach(element => {
            const temp = element.data();
            temp.id = element.id;

            if (temp.status == 0 || temp.status == undefined) {
                activePartners++;
            }

            if (temp.added != undefined) {
                const date = DateTime.fromJSDate(temp.added.toDate());
                if (date.month == thisMonth.month && date.year == thisMonth.year) {
                    newInMonth++;
                }
                if (date.month == lastMonth.month && date.year == lastMonth.year) {
                    newLast++;
                }
            }

            if (temp.active_date_off != undefined) {
                const date = DateTime.fromISO(temp.active_date_off);
                if (date.month == thisMonth.month && date.year == thisMonth.year) {
                    outInMonth++;
                }
                if (date.month == lastMonth.month && date.year == lastMonth.year) {
                    outLast++;
                }
            }
        });

        // Cálculo de índices
        irp = parseFloat((Math.floor(((newInMonth + outInMonth) / 2) / (((activePartners - newInMonth) + (activePartners - outInMonth)) / 2) * 10000) / 100).toFixed(2));
        irpLast = parseFloat((Math.floor(((newLast + outLast) / 2) / (((activePartners - newLast) + (activePartners - outLast)) / 2) * 10000) / 100).toFixed(2));
        retentionIndex = parseFloat((activePartners / (activePartners - outInMonth) * 100).toFixed(2));
        retentionIndexLast = parseFloat(((activePartners - newInMonth) / ((activePartners - newInMonth) - outLast) * 100).toFixed(2));

    }
    
function html(data){
    return data;
}
function setEditId(eId) {
    editData = {field:filterName, value:filterValue,bid:eId};
    showModal = true;
    jQuery('#editModalScrollable').modal('show');
    
}
function setAccepted(id){
    Swal.fire({
                title: "¿Esta seguro?",
                text: "Desea marcar esta vacante como cubierta",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
                confirmButtonText: "Si, cubierta!"
              }).then(function (result) {
                if (result.value) {
                    db.collection("jobs").doc(id).update({status:1,ended:firebase.firestore.Timestamp.now(), endedBy:$fbuser.uid, endedName:$fbuser.displayName ?? ""});
                }
            });

}

function setCancel(id){
    Swal.fire({
                title: "¿Esta seguro?",
                text: "Desea cancelar esta vacante",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
                confirmButtonText: "Si, cancelar!"
              }).then(function (result) {
                if (result.value) {
                    db.collection("jobs").doc(id).update({status:2, cancelBy:$fbuser.uid, cancelName:$fbuser.displayName ?? ""});
                }
            });

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
                    db.collection("jobs").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};


function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("jobs").doc(id).update(update);
}
window.setEditId = setEditId;
window.setAccepted = setAccepted;
window.setCancel = setCancel;
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
    
    <TitleBar title="Vacantes" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                
                
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={profileFilter != null? profileFilter[1]:filterName} value={filterValue} />
                 {/if}
                 
                <JobsHead data={workabsencesMonth} title={"Reporte de vacantes del mes"} />
                
                <h2 >Indicadores</h2>
                <hr>
                <div class="row">
                    <div class="col-12 col-sm-4">
                        <div class="avatar-md font-size-20 mr-3"><span class="avatar-title bg-soft-primary text-primary rounded">
                            <i class="mdi mdi-account-box"></i>
                        </span></div>
                        <p>Empleados Activos: {activePartners}</p>
                        <p>Altas: {newInMonth}</p>
                        <p>Bajas: {outInMonth}</p>
                    </div>
                    <div class="col-12 col-sm-4">
                        <Speedometer value={irp} min={0} max={20} inverse={false} label="Tasa de rotación Mes actual" />
                    </div>
                    <div class="col-12 col-sm-4">
                        <Speedometer value={irpLast} min={0} max={20} inverse={false} label="Tasa de rotación Mes Anterior" />
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-12 col-sm-4">
                        <div class="avatar-md font-size-20 mr-3"><span class="avatar-title bg-soft-primary text-primary rounded">
                            <i class="mdi mdi-account-check"></i>
                        </span></div>
                        <p>Vacantes: {workabsencesMonth.length}</p>
                        <p>Vacantes cubiertas: {hires}</p>
                    </div>
                    <div class="col-12 col-sm-4">
                        <Speedometer value={hiringTime} min={0} max={20} unit={"días"} inverse={false} label="Promedio de contratación Mes actual" />
                    </div>
                    <div class="col-12 col-sm-4">
                        <Speedometer value={hiringTimeLast} min={0} max={20} unit={"días"} inverse={false} label="Promedio de contratación Mes Anterior" />
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-12 col-sm-4">
                        <div class="avatar-md font-size-20 mr-3"><span class="avatar-title bg-soft-primary text-primary rounded">
                            <i class="mdi mdi-account-star"></i>
                        </span></div>
                        <p>Retención de empleados</p>
                        <p>Empleados al incio de mes: {activePartners - outInMonth}</p>
                        <p>Empleados al inico del mes pasado: {(activePartners - newInMonth) - outLast}</p>
                    </div>
                    <div class="col-12 col-sm-4">
                        <Speedometer value={retentionIndex} min={0} max={100} unit={"%"} inverse={false} label="Retención Mes actual" />
                    </div>
                    <div class="col-12 col-sm-4">
                        <Speedometer value={retentionIndexLast} min={0} max={100} unit={"%"} inverse={false} label="Retención Mes Anterior" />
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- end col -->
</div>
<!-- end row -->
</div>
