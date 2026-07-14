<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    import { routes } from "../menu";
    import { fun } from "../callable";

    import { patients } from "../controls/patients.js";
    import PatientsSearchList from "../controls/PatientsSearchList.svelte";

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { flip } from "svelte/animate";

    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { empty } from "svelte/internal";

    const [send, receive] = crossfade({
        duration: (d) => Math.sqrt(d * 200),

        fallback(node, params) {
            const style = getComputedStyle(node);
            const transform = style.transform === "none" ? "" : style.transform;

            return {
                duration: 600,
                easing: quintOut,
                css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`,
            };
        },
    });
    
            
    
    // mes y año y costo 
    // pantalla en pacientes, para agregar adeudos 

    export let params = {};

    let guests = [];
    let datatable;
    let datatable1;
    let unsubscribe;
    let unsubscribe1;

    let loading = false;

    let filterName = params.field;
    let filterValue = params.value;

    let guestBranch = null;

   let weekTotals;
    
    let weekBalance = []; 

    $: guestBranch, branchesTotals();
    var todate = DateTime.local()
                    .setLocale("es-mx")
                    .startOf("month");

    let thismonthyear = todate.toISODate().slice(0, 7);
                
    let todatePretty = todate.toLocaleString({
            month: "long",
            year: "numeric",
        });

    let monthdisplay = todate.toLocaleString({
            month: "long",
            
        });
    
    var thisMonth = DateTime.local()  //mes actual desde el 01
    .setLocale("es-mx")
    .startOf("month");
    
    

    var startDay = thisMonth.weekday + 1; //día de inicio del mes
    let semanasMes = [[],[],[],[],[],[]];
    
    var endOfDays = thisMonth.daysInMonth + startDay; //días totales del mes actual
    
    for (let index = startDay; index < endOfDays; index++) {
        let toArrayWeek = thisMonth.toISODate();
        let wid = Math.floor(index/7);
        semanasMes[wid].push(toArrayWeek);
        thisMonth = thisMonth.plus({ days: 1 });
    }

    let weekDays = [];

    for (let d = 0; d < semanasMes.length; d++) {   
         weekDays.push(semanasMes[d]);
          //semanasMes[d].map(day => day.slice(8, 10)));        
    }

                  

    const hasAdd =
        Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addguest_payments") === 0;
        }).length > 0;
    const hasEdit =
        Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editguest_payments/") === 0;
        }).length > 0;

    onMount(() => {});
    onDestroy(() => {
        if (datatable != undefined && datatable != null) {
            datatable.destroy();
        }
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
        }

        if (datatable1 != undefined && datatable1 != null) {
            datatable1.destroy();
        }
        if (unsubscribe1 != null && unsubscribe1 != undefined) {
            unsubscribe();
        }
    });

/*
    function loadData() {
         datatable = jQuery('#datatable-expected').DataTable({
                lengthChange: false,
                buttons: ['copy', 'excel', 'pdf'],
                responsive: true,
                "scrollX": true
                
            });

            datatable.buttons().container()
                .appendTo('#datatable-expected_wrapper .col-md-6:eq(0)');

                datatable1 = jQuery('#datatable-done').DataTable({
                lengthChange: false,
                buttons: ['copy', 'excel', 'pdf'],
                responsive: true,
                "scrollX": true
                
            });

            datatable1.buttons().container()
                .appendTo('#datatable-done_wrapper .col-md-6:eq(0)');
    }

*/

    let query = db.collection("patients");
    if (filterName != undefined && filterValue != undefined) {
      //  console.log("filter : " + filterName + " == " + filterValue);
        query = query.where(filterName, "==", filterValue);
    }

    unsubscribe = query
    .orderBy("added", "desc")
    .onSnapshot(async (querySnapshot) => {
        const tmp = [];

        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const temppatients = doc.data();
            temppatients.id = doc.id;
            temppatients.pytest = [];
            if (temppatients.paymentlogs == undefined) {
                temppatients.paymentlogs = {};
            }else{
                //  console.log("has payments", temppatients.paymentlogs);
            }
            let lastPayment = "";
            

            // aqui esta el mero mole, hay que filtrar el ultimo pago, y compararlo con el dayEntry, si es menor
            // hay que 
            Object.keys(temppatients.paymentlogs).forEach(element => {
                //console.log("okeys",element);
                if(temppatients.paymentlogs[element].pay == true){
                    temppatients.pytest.push(temppatients.paymentlogs[element]);
                }else{
                    lastPayment = element;
                }
            });

            const array1 = Object.keys(temppatients.paymentlogs);
            temppatients.lastPayment = array1.reduce(
                (result, currentValue) => {
                    if(result > currentValue){
                    return result;
                    }
                    return currentValue;
                },
                "0"
            );
            console.log(temppatients.lastPayment);
            console.log(temppatients);

            if (temppatients.pytest.length > 0) {

                for (let i = 0; i < temppatients.pytest.length; i++) {

                    if(temppatients.pytest[i].paydate != undefined) {
                        let monthyear = temppatients.pytest[i].paydate.slice(0, 7);
                        if(monthyear == thismonthyear) {
                            temppatients.monthpayed = true;
                            temppatients.thismonthyear = thismonthyear;
                            // temppatients.lastPayment = lastPayment;
                        }
                    }

                }
            }

            tmp.push(temppatients);
            
            let dateWork = DateTime.local();      

            let dayEntry = temppatients.entrydate.slice(8, 10);

            let daytoday = dateWork.toISODate().slice(8, 10);
        
            let startWeek = dateWork.set({day: dayEntry}).toISODate();
            
            temppatients['payday'] = startWeek;

            if (daytoday > dayEntry) {
                temppatients['red'] = true;
                
            }
            else if (daytoday < dayEntry) {
                temppatients['red'] = false;
            }

            for (let j = 0; j < semanasMes.length; j++) {
                
                let weekIndex = semanasMes[j].indexOf(startWeek);

                if (weekIndex > -1 )  {
                    let weekGuest = j;     

                    temppatients['payWeek'] =  weekGuest;

                }
            }; 
                
            let objectweek = {
                
                branch: temppatients.branch,
                payweek: temppatients.payWeek,
                monthcost: temppatients.monthcost
                
            }
        
            weekBalance.push(objectweek);
            
            
            guests = tmp;
            if(guests.pytest != undefined && guests.pytest.length > 0) {
                // console.log(guests.pytest);
            };

        });
        /*  datatables
                    await tick();
                    if (datatable == undefined) {
                        loadData();
                    } else {
                        datatable.clear();
                    }

                    datatable.rows('dom').invalidate().draw(false);

                    if (datatable1 == undefined) {
                        loadData();
                    } else {
                        datatable1.clear();
                    }

                    datatable1.rows('dom').invalidate().draw(false);
        */
    });

function asyncChange(id, field, newval) {
    let update = {};
    update[field] = newval;
    db.collection("guest_payments").doc(id).update(update);
}

function timeToAgo(timeStr) {
    if (timeStr == undefined || timeStr == "" || timeStr == null) {
        return "";
    }
    if (timeStr instanceof firebase.firestore.Timestamp) {
        return DateTime.fromJSDate(timeStr.toDate())
            .setLocale("es-mx")
            .toRelative({ days: 1 });
    }
    return DateTime.fromISO(timeStr)
        .setLocale("es-mx")
        .toRelative({ days: 1 });
}

function timeFormated(timeStr) {
    if (timeStr == undefined || timeStr == "" || timeStr == null) {
        return "";
    }
    if (timeStr instanceof firebase.firestore.Timestamp) {
        return DateTime.fromJSDate(timeStr.toDate())
            .setLocale("es-mx")
            .toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
    }
    return DateTime.fromISO(timeStr)
        .setLocale("es-mx")
        .toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
}

function runFunction(fid, params) {
    if (typeof fun[fid] === "function") {
        loading = true;
        fun[fid](params)
        .then((result) => {
            // Read result of the Cloud Function.
            let sanitizedMessage = result.data.text;
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
        });
    }
}
    
  /*function datenumbers() {
    console.log(weekDays);                                   
  }*/

function branchesTotals(id) {
      
    if (id == undefined) {
        id = guestBranch;
        weekTotals = [0,0,0,0,0,0];
    }

    for (let w = 0; w < weekBalance.length; w++){

        if(weekBalance[w].branch == id) {
            weekTotals[weekBalance[w].payweek] += weekBalance[w].monthcost;
        }

    }
}
</script>

<div class="page-content">
    <TitleBar title="Pagos huespedes" base="Inventario" />
    <div class="">
        <p><BranchesSearchList bind:value={guestBranch}/></p>
    </div>

    <div class="card">
        <div class="card-body">
            <h4 class="card-title">Datos cobranza {todatePretty}</h4>
            
            {#if filterName != undefined && filterValue != undefined}
                <FilterName node={filterName} value={filterValue} />
            {/if}
            {#if hasAdd}
                <div class="row">
                    <div class="col" />
                </div>
            {/if}
            
            <table
            id="datatable-expected" 
            class="table table-striped table-bordered dt-responsive nowrap"
            style="border-collapse: collapse; border-spacing: 0; width: 100%;"
            >
                <thead>
                    <tr>
                        <th>Fecha de ingreso: </th>
                        <th>Nombre huesped: </th>
                        <th>Costo mensual: </th>
                        <th>Cobranza esperada: </th>
                        <th>Pagado hasta: </th>
                        <th>Fecha de pago: </th>
                    </tr>
                </thead>

                <tbody>
                    {#if semanasMes[0][0] != undefined}
                        {#each guests as row (row.id) }
                            {#if row.branch == guestBranch}    
                                {#if row.payWeek == 0 && row.status == 0}
                                <tr
                                    style={row.red && !row.monthpayed
                                    ? "background-color:#EA6D6B; color:#FFFFFF"
                                    : !row.red && row.monthpayed
                                    ? "background-color:#FFFA9A"
                                    : "background-color:#FFFA9A"}
                                >
                                
                                    <td>{row.entrydate}</td>
                                    <td>{row.name}</td>   
                                    <td>${row.monthcost}</td> 
                                    <td>${row.monthcost} </td> 
                                    <td>
                                        {#if row.monthpayed}
                                            {row.thismonthyear}
                                        {:else}
                                            {row.lastPayment}
                                        {/if}
                                    </td>
                                    <td>{row.payday}</td>
                                </tr>  
                                {/if}
                            {/if}
                        {/each}
                    {/if}
                    <tr>
                        <td>Del {weekDays[0][0]} a {weekDays[0][weekDays[0].length - 1]} de {monthdisplay}</td>
                        <td></td>
                        <td></td>
                        <td>${weekTotals[0]}</td>
                    </tr>  
                    {#each guests as row (row.id) }
                        {#if row.branch == guestBranch}    
                            {#if row.payWeek == 1 && row.status == 0}
                                <tr
                                style={row.red && !row.monthpayed
                                ? "background-color:#EA6D6B; color:#FFFFFF"
                                : !row.red && row.monthpayed
                                ? "background-color:#FFFA9A"
                                : "background-color:#FFFA9A"}
                                >
                                    <td>{row.entrydate}</td>
                                    <td>{row.name}</td>   
                                    <td>${row.monthcost}</td> 
                                    <td>${row.monthcost} </td> 
                                    <td>
                                        {#if row.monthpayed}
                                            {row.thismonthyear}
                                        {:else}
                                            {row.lastPayment}
                                        {/if}
                                    </td>
                                    <td>{row.payday}</td>
                                </tr>   
                            {/if}
                        {/if}
                    {/each}
                    <tr>
                        <td>Del {weekDays[1][0]} a {weekDays[1][weekDays[1].length - 1]} de {monthdisplay}</td>
                        <td></td>
                        <td></td>
                        <td>${weekTotals[1]}</td>
                    </tr> 
                    {#each guests as row (row.id) }
                        {#if row.branch == guestBranch}    
                            {#if row.payWeek == 2 && row.status == 0}
                                <tr
                                style={row.red && !row.monthpayed
                                ? "background-color:#EA6D6B; color:#FFFFFF"
                                : !row.red && row.monthpayed
                                ? "background-color:#FFFA9A"
                                : "background-color:#FFFA9A"}
                                >
                                    <td>{row.entrydate}</td>
                                    <td>{row.name}</td>   
                                    <td>${row.monthcost}</td> 
                                    <td>${row.monthcost} </td>    
                                    <td>
                                        {#if row.monthpayed}
                                            {row.thismonthyear}
                                        {:else}
                                            {row.lastPayment}
                                        {/if}
                                    </td>
                                    <td>{row.payday}</td>
                                </tr>   
                            {/if}
                        {/if}
                    {/each}
                    <tr>
                        <td>Del {weekDays[2][0]} a {weekDays[2][weekDays[2].length - 1]} de {monthdisplay}</td>
                        <td></td>
                        <td></td>
                        <td>${weekTotals[2]}</td>
                    </tr> 
                    {#each guests as row (row.id) }
                        {#if row.branch == guestBranch}    
                            {#if row.payWeek == 3 && row.status == 0}
                                <tr
                                style={row.red && !row.monthpayed
                                ? "background-color:#EA6D6B; color:#FFFFFF"
                                : !row.red && row.monthpayed
                                ? "background-color:#FFFA9A"
                                : "background-color:#FFFA9A"}
                                >
                                    <td>{row.entrydate}</td>
                                    <td>{row.name}</td>   
                                    <td>${row.monthcost}</td> 
                                    <td>${row.monthcost} </td> 
                                    <td>
                                        {#if row.monthpayed}
                                            {row.thismonthyear}
                                        {:else}
                                            {row.lastPayment}
                                        {/if}
                                    </td>
                                    <td>{row.payday}</td>
                                </tr>   
                            {/if}
                        {/if}
                    {/each}
                    <tr>
                        <td>Del {weekDays[3][0]} a {weekDays[3][weekDays[3].length - 1]} de {monthdisplay}</td>
                        <td></td>
                        <td></td>
                        <td>${weekTotals[3]}</td>
                    </tr> 
                    {#each guests as row (row.id) }
                        {#if row.branch == guestBranch}    
                            {#if row.payWeek == 4 && row.status == 0}
                                <tr
                                style={row.red && !row.monthpayed
                                ? "background-color:#EA6D6B; color:#FFFFFF"
                                : !row.red && row.monthpayed
                                ? "background-color:#FFFA9A"
                                : "background-color:#FFFA9A"}
                                >
                                    <td>{row.entrydate}</td>
                                    <td>{row.name}</td>   
                                    <td>${row.monthcost}</td> 
                                    <td>${row.monthcost} </td> 
                                    <td>
                                        {#if row.monthpayed}
                                            {row.thismonthyear}
                                        {:else}
                                            {row.lastPayment}
                                        {/if}
                                    </td>
                                    <td>{row.payday}</td>
                                </tr>   
                            {/if}
                        {/if}
                    {/each}
                    <tr>
                        <td>Del {weekDays[4][0]} a {weekDays[4][weekDays[4].length - 1]} de {monthdisplay}</td>
                        <td></td>
                        <td></td>
                        <td>${weekTotals[4]}</td>
                    </tr> 
                    {#if semanasMes[5][0] != undefined}
                        {#each guests as row (row.id) }
                            {#if row.branch == guestBranch}    
                                {#if row.payWeek == 5 && row.status == 0}
                                    <tr
                                    style={row.red && !row.monthpayed
                                    ? "background-color:#EA6D6B; color:#FFFFFF"
                                    : !row.red && row.monthpayed
                                    ? "background-color:#FFFA9A"
                                    : "background-color:#FFFA9A"}
                                    >
                                        <td>{row.entrydate}</td>
                                        <td>{row.name}</td>   
                                        <td>${row.monthcost}</td> 
                                        <td>${row.monthcost} </td> 
                                        <td>
                                            {#if row.monthpayed}
                                                {row.thismonthyear}
                                            {:else}
                                                {row.lastPayment}
                                            {/if}
                                        </td>
                                        <td>{row.payday}</td>
                                    </tr>   
                                {/if}
                            {/if}
                        {/each}
                        <tr>
                            <td>Del {weekDays[5][0]} a {weekDays[5][weekDays[5].length - 1]} de {monthdisplay}</td>
                            <td></td>
                            <td></td>
                            <td>${weekTotals[5]}</td>
                        </tr> 
                    {/if}
                </tbody>
            </table>
            <!-- poner aqui table despues de table col -->
        </div>
    </div>
    <!-- end <button on:click={() => datenumbers()}>Sacar numeros</button> col -->
    <!-- end row -->
        <!--<tr>
            <th>Importe pagado: </th>
            <th>Periodo pagado: </th>
            <th>Forma de pago: </th>
            <th>Fecha de pago: </th>
            <th>Folio: </th>
        </tr>-->
    <!-- end <button on:click={() => datenumbers()}>Sacar numeros</button> col -->
</div>
