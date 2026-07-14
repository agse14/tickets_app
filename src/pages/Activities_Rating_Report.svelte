<script>
import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import {fun} from "../callable";
import { permissions, profile} from "../stores.js";
import BranchesSearchList from "../controls/BranchesSearchList.svelte";
import {branches} from "../controls/branches"
import {users} from "../controls/users"

import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';
import { flip } from 'svelte/animate';
import PieMeter from '../controls/PieMeter.svelte';

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
export let profileFilter = null;
export let hasAdd = true;
export let hasEdit = true;

let today = DateTime.local();
let todayValue = today.toISODate();
let last4Weeks = today.minus({ days: 15 });
let view = 1;

let cardActivities = [];
let datatable;
let unsubscribe;
let unsubscribeProfile;
let loading = false;
let showModal = false;

let filterName = params.field;
let filterValue = params.value;
let editData = {field:filterName, value:filterValue,bid:undefined};

let branch;
let activitiesData = {};
let ratingsSummary = {};
let tags = [];

$: filterValue, loadBranch();
let branchesUnsubscribe = branches.subscribe(value => {
    loadBranch();
});

function loadBranch(){
    activitiesData = {};
    tags = [];
    
    if(filterValue != undefined && filterValue != null && filterValue != ""){
        if($branches.length == 0){
            return;
        }
        let tmp = $branches.filter((el) => {
            return el.id == filterValue;
        });
        if(tmp.length > 0){
            branch = tmp[0];
        }
    }
    ratingsSummary = {};
    
    // for today minus 7 days to today
    for (let index = 0; index < 14; index++) {
        const date = today.minus({ days: index });
        ratingsSummary[date.toISODate()] = {
            date: date,
            total: 0,
            rating100: 0,
            rating50: 0,
            rating0: 0,
            percentage: 0
        };
    }

    // Procesar actividades para calcular calificaciones
    for (const activity of cardActivities) {
        if(activity.branch == filterValue){
            if(activity.dayId != undefined){
                let activityDate = activity.dayId; // Ya es string de fecha ISO
                
                console.log('Processing activity:', {
                    name: activity.name,
                    dayId: activity.dayId,
                    time: activity.time,
                    checkActivity: activity.checkActivity,
                    checkDate: activity.checkDate,
                    branch: activity.branch
                });
                
                if(activitiesData[activityDate] == undefined){
                    activitiesData[activityDate] = {
                        date: DateTime.fromISO(activityDate),
                        activities: []
                    };
                }
                
                let rating = calculateActivityRating(activity);
                activity.rating = rating;
                
                console.log('Activity rating calculated:', rating, 'for', activity.name);
                
                activitiesData[activityDate].activities.push(activity);
                
                // Actualizar resumen solo si la fecha está en nuestro rango
                if(ratingsSummary[activityDate]){
                    ratingsSummary[activityDate].total++;
                    if(rating === 100) ratingsSummary[activityDate].rating100++;
                    else if(rating === 50) ratingsSummary[activityDate].rating50++;
                    else ratingsSummary[activityDate].rating0++;
                    
                    // Calcular porcentaje general
                    ratingsSummary[activityDate].percentage = 
                        ((ratingsSummary[activityDate].rating100 + ratingsSummary[activityDate].rating50 * 0.5) / ratingsSummary[activityDate].total) * 100;
                }
            }
        }
    }
    
    console.log(activitiesData);
    console.log(ratingsSummary);
}

function calculateActivityRating(activity) {
    // Si no está marcada como completada, calificación 0
    if (!activity.checkActivity) {
        console.log('Activity not checked:', activity.name);
        return 0;
    }
    
    if (!activity.time || !activity.checkDate) {
        console.log('Missing time or checkDate:', activity.name, activity.time, activity.checkDate);
        return 100; // Si no hay tiempos definidos, asumir 100%
    }
    
    // Parsear tiempo programado de la actividad (ej: "12:00")
    const activityTime = parseActivityTime(activity.time, activity.dayId);
    // Parsear tiempo cuando se marcó como completada (timestamp de Firebase)
    const checkTime = activity.checkDate.toDate();
    
    if (!activityTime || !checkTime) {
        console.log('Could not parse times:', activity.name, activityTime, checkTime);
        return 100;
    }
    
    console.log('Calculating rating for:', {
        activityName: activity.name,
        scheduledTime: activity.time,
        dayId: activity.dayId,
        activityTimeParsed: activityTime,
        checkDate: checkTime,
        checkDateFormatted: checkTime.toLocaleString()
    });
    
    // Calcular diferencia en minutos (checkTime - activityTime)
    const diffMinutes = (checkTime.getTime() - activityTime.getTime()) / (1000 * 60);
    
    console.log('Time difference in minutes:', diffMinutes, {
        checkTime: checkTime.getTime(),
        activityTime: activityTime.getTime(),
        difference: checkTime.getTime() - activityTime.getTime()
    });
    
    let rating;
    
    // Las actividades pueden empezarse a marcar 30 minutos antes
    if (diffMinutes < -30) {
        rating = 0; // Muy temprano (más de 30 min antes)
        console.log('Too early (more than 30 min before)');
    }
    // Dentro de la primera hora (desde 30 min antes hasta 60 min después): 100%
    else if (diffMinutes <= 60) {
        rating = 100;
        console.log('Perfect timing (within 1 hour)');
    }
    // Entre 1 y 2 horas después: 50%
    else if (diffMinutes <= 120) {
        rating = 50;
        console.log('Late but acceptable (1-2 hours late)');
    }
    // Más de 2 horas después: 0%
    else {
        rating = 0;
        console.log('Too late (more than 2 hours)');
    }
    
    console.log('Final rating:', rating, 'for activity:', activity.name);
    return rating;
}

function parseActivityTime(timeString, dayId) {
    if (!timeString || !dayId) {
        console.log('Missing timeString or dayId:', timeString, dayId);
        return null;
    }
    
    try {
        // timeString es como "12:00", dayId es como "2025-08-03"
        const [hours, minutes] = timeString.split(':').map(Number);
        
        // Crear fecha completa combinando dayId con la hora
        // Usar la misma zona horaria que checkDate para comparación consistente
        const fullDate = new Date(dayId + 'T' + timeString + ':00');
        
        console.log('Parsed activity time:', {
            input: timeString + ' on ' + dayId,
            hours: hours,
            minutes: minutes,
            result: fullDate,
            resultFormatted: fullDate.toLocaleString()
        });
        
        return fullDate;
    } catch (e) {
        console.error('Error parsing activity time:', timeString, dayId, e);
        return null;
    }
}

function parseTime(timeString) {
    if (!timeString) return null;
    
    try {
        // Si es un timestamp de Firebase
        if (timeString.toDate) {
            return timeString.toDate();
        }
        
        // Si es una fecha ISO o otro formato
        return new Date(timeString);
    } catch (e) {
        console.error('Error parsing time:', timeString, e);
        return null;
    }
}

function getRatingColor(rating) {
    if (rating === 100) return 'success';
    if (rating === 50) return 'warning';
    return 'danger';
}

function getRatingBadgeClass(rating) {
    if (rating === 100) return 'badge-success';
    if (rating === 50) return 'badge-warning';
    return 'badge-danger';
}

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
    if(branchesUnsubscribe != null && branchesUnsubscribe != undefined){
        branchesUnsubscribe();
        branchesUnsubscribe = undefined;
    }
});

if(profileFilter !== null){
    unsubscribeProfile = profile.subscribe(value => {
        if(value == undefined && !$permissions.admin){
            console.log("no profile");
            return;
        }
        if(!$permissions.admin && !$permissions.supervision_tags_check){
            console.log("not admin",value);
            filterName = profileFilter[0];
            filterValue = value != undefined ? (value[profileFilter[1]] ?? ''):'';
        }
        loadFirebaseData();
    });
}else{
    loadFirebaseData();
}

function loadFirebaseData(){
    // Como dayId es un string de fecha ISO, usamos strings para la consulta
    let startDateStr = last4Weeks.toISODate();
    let endDateStr = today.plus({days:1}).toISODate();
    
    let query = db.collection("cardActivities")
        .where("dayId",">=", startDateStr)
        .where("dayId","<=", endDateStr);
        
    console.log("activities_rating query range:", {
        start: startDateStr, 
        end: endDateStr
    });
    
    unsubscribe = query.onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            const tempActivity = doc.data();
            tempActivity.id = doc.id;
            tempActivity.did = doc.id;
            
            tempActivity.branchName = "";
            $branches.forEach(elbranches => {
                if(elbranches.id == tempActivity.branch){
                    tempActivity.branchName = elbranches.name;
                }
            });

            tmp.push(tempActivity);
        });
        
        console.log('Found activities:', tmp.length, 'Sample activity:', tmp[0]);
        cardActivities = tmp;
        loadBranch(); // Recalcular ratings cuando cambien los datos
    });
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
</script>

<div class="page-content">
    <TitleBar title="Reporte de Calificaciones de Actividades" base="Actividades" />
    <div class="">
        <p>
            <BranchesSearchList bind:value={filterValue} inlist={!hasEdit} />
        </p>
    </div>
    
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Calificaciones por Cumplimiento de Actividades</h4>
                    
                    {#if filterName != undefined && filterValue != undefined}
                        <FilterName node={profileFilter != null? profileFilter[1]:filterName} value={filterValue} />
                    {/if}
                    
                    <div class="alert alert-info">
                        <strong>Criterios de Calificación:</strong>
                        <ul class="mb-0 mt-2">
                            <li><span class="badge badge-success">100%</span> - Actividad completada dentro de 1 hora (puede iniciarse 30 min antes)</li>
                            <li><span class="badge badge-warning">50%</span> - Actividad completada entre 1-2 horas después del inicio</li>
                            <li><span class="badge badge-danger">0%</span> - Actividad no completada o completada después de 2 horas</li>
                        </ul>
                    </div>
                    
                    <div class="alert alert-secondary">
                        <strong>Cálculo del Porcentaje General:</strong>
                        <p class="mb-1 mt-2">El porcentaje general se calcula usando la siguiente fórmula:</p>
                        <code class="bg-light p-2 d-block">
                            Porcentaje = ((Actividades 100% + Actividades 50% × 0.5) ÷ Total de Actividades) × 100
                        </code>
                        <small class="text-muted mt-2 d-block">
                            <strong>Ejemplo:</strong> Si tienes 10 actividades totales: 6 al 100%, 2 al 50%, 2 al 0% = ((6 + 2×0.5) ÷ 10) × 100 = 70%
                        </small>
                    </div>
                    
                    <hr />
                    
                    <table class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Porcentaje General</th>
                                <th>Actividades 100%</th>
                                <th>Actividades 50%</th>
                                <th>Actividades 0%</th>
                                <th>Total Actividades</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#if branch != undefined}
                                {@const hasActivities = Object.values(ratingsSummary).some(summary => summary.total > 0)}
                                {#if hasActivities}
                                    {#each Object.entries(ratingsSummary) as [dateKey, summary]}
                                        {#if summary.total > 0}
                                            <tr>
                                                <td>
                                                    <strong>{summary.date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</strong>
                                                </td>
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <div class="progress flex-grow-1 me-2" style="height: 25px;">
                                                            <div class="progress-bar bg-{summary.percentage >= 80 ? 'success' : summary.percentage >= 60 ? 'warning' : 'danger'}" 
                                                                 role="progressbar" 
                                                                 style="width: {summary.percentage}%">
                                                                {summary.percentage.toFixed(1)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span class="badge {getRatingBadgeClass(100)} badge-lg">
                                                        {summary.rating100}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span class="badge {getRatingBadgeClass(50)} badge-lg">
                                                        {summary.rating50}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span class="badge {getRatingBadgeClass(0)} badge-lg">
                                                        {summary.rating0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{summary.total}</strong>
                                                </td>
                                            </tr>
                                        {/if}
                                    {/each}
                                {:else}
                                    <tr>
                                        <td colspan="6" class="text-center py-4">
                                            <div class="alert alert-warning mb-0">
                                                <i class="bx bx-info-circle font-size-18"></i>
                                                <h5 class="mt-2">No hay actividades registradas</h5>
                                                <p class="mb-0">
                                                    La estancia <strong>"{branch.name}"</strong> no tiene actividades registradas 
                                                    en el rango de fechas seleccionado ({last4Weeks.toLocaleString(DateTime.DATE_SHORT)} - {today.toLocaleString(DateTime.DATE_SHORT)}).
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                {/if}
                            {:else}
                                <tr>
                                    <td colspan="6" class="text-center py-4">
                                        <div class="alert alert-info mb-0">
                                            <i class="bx bx-building font-size-18"></i>
                                            <h5 class="mt-2">Seleccione una estancia</h5>
                                            <p class="mb-0">Por favor seleccione una estancia arriba para ver las calificaciones de actividades.</p>
                                        </div>
                                    </td>
                                </tr>
                            {/if}
                        </tbody>
                    </table>
                    
                    <!-- Detalles por día -->
                    {#if view === 2}
                        <hr />
                        <h5>Detalle de Actividades por Día</h5>
                        {#each Object.entries(activitiesData) as [dateKey, dayData]}
                            <div class="card mt-3">
                                <div class="card-header">
                                    <h6 class="mb-0">{dayData.date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        {#each dayData.activities as activity}
                                            <div class="col-md-4 mb-2">
                                                <div class="border p-2 rounded bg-{getRatingColor(activity.rating)}-light">
                                                    <small><strong>{activity.activitiesName || 'Actividad'}</strong></small><br>
                                                    <small>Paciente: {activity.patientName || 'N/A'}</small><br>
                                                    <small>Hora programada: {activity.time}</small><br>
                                                    <small>Hora realizada: {activity.checkTime || 'No realizada'}</small><br>
                                                    <span class="badge {getRatingBadgeClass(activity.rating)}">
                                                        {activity.rating}%
                                                    </span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .badge-lg {
        font-size: 1rem;
        padding: 0.5rem 1rem;
    }
    
    .progress {
        margin-right: 10px;
    }
    
    .bg-success-light {
        background-color: #d4edda !important;
        border-color: #c3e6cb !important;
    }
    
    .bg-warning-light {
        background-color: #fff3cd !important;
        border-color: #ffeaa7 !important;
    }
    
    .bg-danger-light {
        background-color: #f8d7da !important;
        border-color: #f5c6cb !important;
    }
</style>
