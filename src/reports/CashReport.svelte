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
    import { each, element, empty } from "svelte/internal";
    import { branches } from "../controls/branches";

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

    let cobranzaMes = {
        current:{total:0},
        previous:{total:0},
        advance:{total:0},    
        total:0
    };

    let projection = {
        expected:{total:0},
        recipt:{total:0},
        pending_month:{total:0},
        pending_all:{total:0},    
        total:0
    };



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
let testBranch = "HIALetBu8b82yyMp3FlH";
let debugTag = "";
// let debugObject = {esperada:[],recibida:[],pendiente_mes:[] ,pendiente_all:[], current:[],total:0};
let debugBranches = {};
    let query = db.collection("patients");
    unsubscribe = query
    // .where("branch", "==", "qx35chmZldSQObw5z26B")
    .orderBy("added", "desc")
    .onSnapshot(async (querySnapshot) => {
        const tmp = [];
        resetCobranza();
        let currentMonth = DateTime.local().setLocale("es-mx").startOf("month");
        let lastMonth = DateTime.local().setLocale("es-mx").minus({ months: 1 }).startOf("month");
        // let previousMonth = DateTime.local().setLocale("es-mx").minus({ months: 2 }).endOf("month");
        // debugObject = {esperada:[],recibida:[],pendiente_mes:[] ,pendiente_all:[], current:[],total:0};
        debugBranches = {};
        // console.log("querySnapshot", querySnapshot.docs.length);
        for(let q = 0; q < querySnapshot.docs.length; q++) {
            let doc = querySnapshot.docs[q];
        // querySnapshot.forEach((doc) => {
            
            const temppatients = doc.data();
            console.log(`${doc.id} => ${temppatients}`);
            if(temppatients.status > 0 || temppatients.test == true) {
                continue;
            }
            if(debugBranches[temppatients.branch] == undefined){
                debugBranches[temppatients.branch] = {esperada:[],recibida:[],pendiente_mes:[] ,pendiente_all:[], current:[],total:0};
            }
            temppatients.id = doc.id;
            temppatients.pytest = [];
            if (temppatients.paymentlogs == undefined) {
                temppatients.paymentlogs = {};
            }else{
                //  console.log("has payments", temppatients.paymentlogs);
            }
            let lastPayment = "";
            let previousMonthsPayments = 0;
            let advancePayments = 0;
            

            // aqui esta el mero mole, hay que filtrar el ultimo pago, y compararlo con el dayEntry, si es menor
            for (let i = 0; i < Object.keys(temppatients.paymentlogs).length; i++) {
                let key = Object.keys(temppatients.paymentlogs)[i];
                if(temppatients.paymentlogs[key].pay == true && lastPayment < key) {
                    temppatients.pytest.push(temppatients.paymentlogs[key]);
                    lastPayment = key;
                }
                let payDate = DateTime.fromISO(temppatients.paymentlogs[key].paydate).startOf("month").toISODate();
                
                if(payDate == currentMonth.toISODate()){
                    // console.log("paydate",payDate , key, currentMonth.toISODate());
                    if(key != currentMonth.toISODate()){
                        //console.log("pagado otros meses", key, currentMonth.toISODate(), temppatients.id);
                        if(key > currentMonth.toISODate()){
                            advancePayments += temppatients.paymentlogs[key].paid;
                        }else{
                            previousMonthsPayments += temppatients.paymentlogs[key].paid;
                        }
                    }
                }
            }

            //Cobranza esperada del mes
            
            if(lastPayment == ""){
                console.log("added", temppatients.id, temppatients.added);
                let addedDate = DateTime.fromJSDate(temppatients.added.toDate()).startOf("month");
                lastPayment = addedDate.toISODate();
            }
            // if(temppatients.branch  == testBranch){
                debugBranches[temppatients.branch].esperada.push({id:temppatients.id,branch:temppatients.branch,monthcost:temppatients.monthcost, lastPayment: lastPayment, paymentlogs: temppatients.paymentlogs, name: temppatients.name});
            // }
            if(lastPayment <= currentMonth.toISODate()){
                
                projection.expected.total += temppatients.monthcost;
                if(projection.expected[temppatients.branch] == undefined){
                    projection.expected[temppatients.branch] = temppatients.monthcost;
                }else{
                    projection.expected[temppatients.branch] += temppatients.monthcost;
                }
            }

            cobranzaMes.previous.total += previousMonthsPayments;
            if(cobranzaMes.previous[temppatients.branch] == undefined){
                cobranzaMes.previous[temppatients.branch] = previousMonthsPayments;
            }else{
                cobranzaMes.previous[temppatients.branch] += previousMonthsPayments;
            }

            cobranzaMes.advance.total += advancePayments;
            if(cobranzaMes.advance[temppatients.branch] == undefined){
                cobranzaMes.advance[temppatients.branch] = advancePayments;
            }else{
                cobranzaMes.advance[temppatients.branch] += advancePayments;
            }

            
            // Object.keys(temppatients.paymentlogs).forEach(element => {
            //     //console.log("okeys",element);
            //     if(temppatients.paymentlogs[element].pay == true){
            //         temppatients.pytest.push(temppatients.paymentlogs[element]);
            //     }else{
            //         lastPayment = element;
            //     }
            // });
            temppatients.lastPayment = lastPayment;
            // console.log(temppatients.lastPayment, currentMonth.toISODate());
            if(cobranzaMes[temppatients.branch] == undefined){
                cobranzaMes[temppatients.branch] = previousMonthsPayments + advancePayments;
            }else{
                cobranzaMes[temppatients.branch] += previousMonthsPayments + advancePayments;
            }
            cobranzaMes.total += previousMonthsPayments + advancePayments;
            
            if(lastPayment == currentMonth.toISODate()){
                
                cobranzaMes.current.total += temppatients.monthcost;
                if(cobranzaMes.current[temppatients.branch] == undefined){
                    cobranzaMes.current[temppatients.branch] = temppatients.monthcost;
                }else{
                    cobranzaMes.current[temppatients.branch] += temppatients.monthcost;
                }

                projection.recipt.total += temppatients.monthcost;
                if(projection.recipt[temppatients.branch] == undefined){
                    projection.recipt[temppatients.branch] = temppatients.monthcost;
                }else{
                    projection.recipt[temppatients.branch] += temppatients.monthcost;
                }

                cobranzaMes[temppatients.branch] += temppatients.monthcost;
                // if(temppatients.branch  == testBranch){
                    debugBranches[temppatients.branch].current.push({id:temppatients.id,branch:temppatients.branch,monthcost:temppatients.monthcost, lastPayment: lastPayment, paymentlogs: temppatients.paymentlogs, name: temppatients.name});
                // }
                   
            }else if(lastPayment <= lastMonth.toISODate()){

                projection.pending_month.total += temppatients.monthcost;
                if(projection.pending_month[temppatients.branch] == undefined){
                    projection.pending_month[temppatients.branch] = temppatients.monthcost;
                }else{
                    projection.pending_month[temppatients.branch] += temppatients.monthcost;
                }
                // if(temppatients.branch  == testBranch){
                
                    debugBranches[temppatients.branch].pendiente_mes.push({id:temppatients.id,branch:temppatients.branch,monthcost:temppatients.monthcost, lastPayment: lastPayment, paymentlogs: temppatients.paymentlogs, name: temppatients.name});
                // }
                
                if(lastPayment < lastMonth.toISODate()){
                    // if(temppatients.branch  == testBranch){
                        debugBranches[temppatients.branch].pendiente_all.push({id:temppatients.id,branch:temppatients.branch,monthcost:temppatients.monthcost, lastPayment: lastPayment, paymentlogs: temppatients.paymentlogs, name: temppatients.name});
                    // }
                    if(lastPayment == ""){
                        console.log("ERROR: no hay pagos "+temppatients.id);
                        continue;
                    }
                    let lastPaymentDate = DateTime.fromISO(lastPayment);
                    while(lastPaymentDate.toISODate() < lastMonth.toISODate()){
                        lastPaymentDate = lastPaymentDate.plus({months: 1});
                        projection.pending_all.total += temppatients.monthcost;
                        if(projection.pending_all[temppatients.branch] == undefined){
                            projection.pending_all[temppatients.branch] = temppatients.monthcost;
                        }else{
                            projection.pending_all[temppatients.branch] += temppatients.monthcost;
                        }
                    }
                }
                
                
                
            }

            

        }

        // console.log("cosas debug", debugObject );
        
    });

    function resetCobranza() {

        projection = {
            expected:{total:0},
            recipt:{total:0},
            pending_month:{total:0},
            pending_all:{total:0},    
            total:0
        };

        cobranzaMes = {
            current:{total:0},
            previous:{total:0},
            advance:{total:0},    
            total:0
        };

        // for (let i = 0; i < guests.length; i++) {
        //     if (guests[i].monthpayed == true) {
        //         cobranza.current.total += guests[i].monthcost;
        //     } else {
        //         if (guests[i].lastPayment != undefined) {
        //             let lastPayment = guests[i].lastPayment.slice(0, 7);
        //             if (lastPayment == thismonthyear) {
        //                 cobranza.previous.total += guests[i].monthcost;
        //             } else {
        //                 cobranza.advance.total += guests[i].monthcost;
        //             }
        //         } else {
        //             cobranza.advance.total += guests[i].monthcost;
        //         }
        //     }
        // }

        // cobranza.total = cobranza.current.total + cobranza.previous.total + cobranza.advance.total;

        // for (let i = 0; i < guests.length; i++) {
        //     if (guests[i].monthpayed == true) {
        //         projection.recipt.total += guests[i].monthcost;
        //     } else {
        //         if (guests[i].lastPayment != undefined) {
        //             let lastPayment = guests[i].lastPayment.slice(0, 7);
        //             if (lastPayment == thismonthyear) {
        //                 projection.pending_month.total += guests[i].monthcost;
        //             } else {
        //                 projection.pending_all.total += guests[i].monthcost;
        //             }
        //         } else {
        //             projection.pending_all.total += guests[i].monthcost;
        //         }
        //     }
        // }

        // projection.expected.total = cobranza.total;
        // projection.total = projection.recipt.total + projection.pending_month.total + projection.pending_all.total;

        // return {cobranza, projection};
    }

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
        <p></p>
    </div>

    <div class="card">
        <div class="card-body">
            <h4 class="card-title">Datos cobranza {todatePretty}</h4>
            
            {#if filterName != undefined && filterValue != undefined}
                <FilterName node={filterName} value={filterValue} />
            {/if}
            
            <table
            id="datatable-expected" 
            class="table table-striped table-bordered dt-responsive nowrap"
            style="border-collapse: collapse; border-spacing: 0; width: 100%;"
            >
                <thead>
                    <tr>
                        <th>Detalle de cobranza del mes</th>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    <th on:click={()=>{debugTag = branch.id;}} style="cursor: pointer;">{branch.name}</th>
                                {/if}
                        {/each}
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    <tr>
                        <td><b>Cobranza del mes</b></td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if cobranzaMes[branch.id] != undefined}
                                        <td>$ {cobranzaMes[branch.id].toLocaleString("es-MX")}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>${cobranzaMes.total.toLocaleString("es-MX")}</td>
                    </tr>  
                    <tr>
                        <td>Del mes el curso</td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if cobranzaMes.current[branch.id] != undefined}
                                        <td>$ {cobranzaMes.current[branch.id].toLocaleString("es-MX")}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>$ {cobranzaMes.current.total.toLocaleString("es-MX")}</td>
                    </tr> 
                    <tr>
                        <td>De meses anteriores</td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if cobranzaMes.previous[branch.id] != undefined}
                                        <td>$ {cobranzaMes.previous[branch.id].toLocaleString("es-MX")}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>$ {cobranzaMes.previous.total.toLocaleString("es-MX")}</td>
                    </tr> 
                    <tr>
                        <td>Cobranza adelantada</td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if cobranzaMes.advance[branch.id] != undefined}
                                        <td>$ {cobranzaMes.advance[branch.id]}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>${cobranzaMes.advance.total.toLocaleString("es-MX")}</td>
                    </tr> 

                    <tr>
                        <td><b>Cobranza esperada del mes</b></td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if projection.expected[branch.id] != undefined}
                                        <td>$ {projection.expected[branch.id].toLocaleString("es-MX")}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>${projection.expected.total.toLocaleString("es-MX")}</td>
                    </tr>  
                    <tr>
                        <td>Cobranza recibida</td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if projection.recipt[branch.id] != undefined}
                                        <td>$ {projection.recipt[branch.id].toLocaleString("es-MX")}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>${projection.recipt.total.toLocaleString("es-MX")}</td>
                    </tr> 
                    <tr>
                        <td>Cobranza pendiente del mes</td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if projection.pending_month[branch.id] != undefined}
                                        <td>$ {projection.pending_month[branch.id].toLocaleString("es-MX")}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>${projection.pending_month.total.toLocaleString("es-MX")}</td>
                    </tr> 
                    <tr>
                        <td>Cobranza pendiente de meses anteriores</td>
                        {#each $branches as branch (branch.id)}
                                {#if branch.test != true}
                                    {#if projection.pending_all[branch.id] != undefined}
                                        <td>$ {projection.pending_all[branch.id].toLocaleString("es-MX")}</td>
                                    {:else}
                                        <td>$ 0</td>
                                    {/if}
                                {/if}
                        {/each}
                        <td>${projection.pending_all.total.toLocaleString("es-MX")}</td>
                    </tr> 
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
    {#if debugTag != "" && debugBranches[debugTag] != undefined}
    <div class="card">
        <div class="card-body">
            <h3>Estatus de pagos</h3>
            <table class="detail">
                <th>Nombre</th><th>Pagado hasta</th><th>Cargo mensual</th>
            {#each debugBranches[debugTag].esperada as es}
                <tr><td>{es.name}</td><td>{es.lastPayment}</td><td>{es.monthcost.toLocaleString("es-mx")}</td></tr>
            {/each}
            </table>
        </div>
    </div>
    <div class="card">
        <div class="card-body">
            <h3>Cobranza pendiente del mes</h3>
            <table class="detail">
            <th>Nombre</th><th>Pagado hasta</th><th>Cargo mensual</th>
            {#each debugBranches[debugTag].pendiente_mes as es}
                <tr><td>{es.name}</td><td>{es.lastPayment}</td><td>{es.monthcost.toLocaleString("es-mx")}</td></tr>
            {/each}
            </table>
        </div>
    </div>
    <div class="card">
        <div class="card-body">
            <h3>Cobranza pendiente meses anteriores</h3>
            <table class="detail">
            <th>Nombre</th><th>Pagado hasta</th><th>Cargo mensual</th>
            {#each debugBranches[debugTag].pendiente_all as es}
                <tr><td>{es.name}</td><td>{es.lastPayment}</td><td>{es.monthcost.toLocaleString("es-mx")}</td></tr>
            {/each}
            </table>
        </div>
    </div>
    {/if}
</div>

<style>
    td {
        white-space: nowrap;
    }
    .card-body {
        width: 100%;
        overflow-x: auto;
    }
    .detail td {
        padding: 5px 10px;
    }
</style>