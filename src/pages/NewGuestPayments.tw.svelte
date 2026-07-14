<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    import { routes } from "../menu";
    import { permissions, profile} from "../stores.js";
    import { fun } from "../callable";
    import {calculatePercent} from "../Utils/payments.js";

    import { patients } from "../controls/patients.js";
    import PatientsSearchList from "../controls/PatientsSearchList.svelte";

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { flip } from "svelte/animate";

    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import 'iconify-icon';
    import PaymentStatus from "../controls/PaymentStatus.tw.svelte";
    import { each } from "svelte/internal";

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
    let unsubscribe;
    let unsubscribePayments;
    let fecha;
    let recipt_payments = [];

    let loading = false;

    let filterName = params.field;
    let filterValue = params.value;

    let now = DateTime.local().setLocale("es-mx");

    const hasAdd =
        Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addguest_payments") === 0;
        }).length > 0;
    let hasEdit =
        false;

    const unsubscribeProfile = profile.subscribe(value => {
        if(value == undefined && !$permissions.admin){
            console.log("no profile");
            return;
        }
		if(!$permissions.admin && !$permissions.accounting && !$permissions.view_payments){
            console.log("not admin",value);

            filterName = 'branch';
            filterValue = value?.branches ?? '';
        }else{
            hasEdit = true;
            try{
                let vObject = window.localStorage.getItem("filterValue");
                if(vObject != undefined && vObject != null){
                    filterValue = vObject;
                }

            }catch(e){
                console.log(e);
            }
        }
        loadFirebaseData();
	});

    $: filterValue, setItemStorage();
    function setItemStorage(){
        if(filterValue == undefined || filterValue == null || filterValue == "") return;
        try{
            window.localStorage.setItem("filterValue", filterValue);
        }catch(e){
            console.log(e);
        }
    }

    onMount(() => {});
    onDestroy(() => {
        if (datatable != undefined && datatable != null) {
            datatable.destroy();
        }
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
        }
        if (unsubscribePayments != null && unsubscribePayments != undefined) {
            unsubscribePayments();
        }
        unsubscribeProfile();
    });
    function loadData() {
        /*   datatable = jQuery('#guest_payments-dt').DataTable({
                lengthChange: false,
                buttons: ['copy', 'excel', 'pdf'],
                responsive: true,
                "scrollX": true
                
            });

            datatable.buttons().container()
                .appendTo('#guest_payments-dt_wrapper .col-md-6:eq(0)');*/
    }

    

    function separateWeeks(querySnapshot) {
        var thisMonth = DateTime.local() //mes actual desde el 01
            .setLocale("es-mx")
            .startOf("month");

        var startDay = thisMonth.weekday + 1; //día de inicio del mes
        let semanasMes = [[], [], [], [], [], []];

        var kickOffDay = 6 - startDay;

        var endOfDays = thisMonth.daysInMonth + startDay; //días totales del mes actual

        var endMonthGen = false;

        //  console.log();

        for (let index = startDay; index < endOfDays; index++) {
            let toArrayWeek = thisMonth.toISODate();
            var wid = Math.floor(index / 7);
            //console.log();
            semanasMes[wid].push(toArrayWeek);
            thisMonth = thisMonth.plus({ days: 1 });
        }

        // console.log(endOfDays,semanasMes);
    }
    // October 2024
    
    function loadFirebaseData(){
        let query = db.collection("patients");
        if (filterName != undefined && filterValue != undefined) {
            //console.log("filter : " + filterName + " == " + filterValue);
            query = query.where(filterName, "==", filterValue);
        }
        let paymentsMonth = DateTime.fromISO("2024-10-01"); 
        unsubscribePayments = db.collection("recipt_payments")
            .where("added", ">=", paymentsMonth.startOf("month").toJSDate())
            .where("added", "<", paymentsMonth.endOf("month").toJSDate())
            .onSnapshot(async (querySnapshot) => {
            const tmp = [];

            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const temppositions = doc.data();
                temppositions.id = doc.id;
                tmp.push(temppositions);
            });
            recipt_payments = tmp;
            //console.log(guest_payments);
        });

        unsubscribe = query
        .orderBy("name")
        .onSnapshot(async (querySnapshot) => {
            const tmp = [];

            separateWeeks(querySnapshot);
            querySnapshot.forEach(async (doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                // impirmir el id del documento y el name de los registros que no tienen entrydate
                if(doc.data().entrydate == undefined){
                    console.log(doc.id,doc.data().name,"no tiene fecha de ingreso",doc.data().branch);
                }

                let temppatients = doc.data();
                temppatients.id = doc.id;
                temppatients = await calculatePercent(temppatients);
                
                if(temppatients.status == 1 || temppatients.status == 2){
                    // console.log("baja ",temppatients);
                    return;
                }
                temppatients.id = doc.id;
                //Formateo de fecha para mostrar de mejor forma en el listado
                fecha = luxon.DateTime.fromISO(temppatients.entrydate);
                // console.log(fecha);
                //Se agrega al array con el siguiente formato
                temppatients.fechapago = fecha.startOf("month");
                temppatients.entrydateFormatted = fecha.toFormat("d'/'MM'/'yyyy");
                //Se sigue llenando los demas datos
                temppatients.pytest = [];
                if (temppatients.paymentlogs == undefined) {
                    temppatients.paymentlogs = {};
                } else {
                    // console.log("has payments", temppatients.paymentlogs);
                }
                if(temppatients.added != undefined){
                    temppatients.addedDate = DateTime.fromJSDate(temppatients.added.toDate()).setLocale("es-mx");
                    // console.log(temppatients.addedDate.toFormat("d'/'MM'/'yyyy"));
                }

                Object.keys(temppatients.paymentlogs).forEach((element) => {
                    //console.log("okeys",element);
                    if (temppatients.paymentlogs[element].pay != true) {
                        //temppatients.paymentlogs[element].
                        temppatients.pytest.push(
                            temppatients.paymentlogs[element]
                        );
                    } 
                });
                //console.log(temppatients);
                tmp.push(temppatients);

                //let td; //testdate

                guests = tmp;

                //guests.forEach(({ entrydate }) => (td = entrydate));

                let id = 0;

                /*
                var lastPayment = null;

                var pending = [];
                for(var pastpayment in patient.payments){
                if(pastpayment.pay == true){
                 if(lastPayment  == null){ 
                   lastPayment=pastpayment; 
                  }else{
                    if(checar si pastpayment es despues de lastPayment){
                  //si lo es
                      lastPayment=pastpayment; 
                    }
                       }
                 }else{
                     pending.push(pastpayment);

                          }
                        }*/
                        // console.log(temppatients.name,temppatients.fechapago);
                        // console.log(temppatients.name,temppatients.addedDate);
                let tdini;        
                if (temppatients.addedDate > temppatients.fechapago) {
                    tdini = temppatients.addedDate.startOf("month");
                } else {
                    tdini = temppatients.fechapago.startOf("month");
                }
                
                
                // DateTime.local()
                    
                //     .startOf("month");
                const endDate = now.startOf("month").plus({ months: 3 });
                var i = Interval.fromDateTimes(tdini, endDate).length('months');

                //luego va el for que genera los pagos por mes, pero en lugar de que empieze de la fecha actual, que empieze del lastPayment (si lastPayment == null) empieza de la fecha de registro del paciente
                let skip = false;
                let startPrinting = false;


                for (let index = 0; index <= i; index++) {
                    let dateGen = tdini.toISODate();
                    let datePretty = tdini.toLocaleString({
                        month: "long",
                        year: "numeric",
                    });
                    skip = false;

                    for (let i = 0; i < temppatients.pytest.length; i++) {
                        if (temppatients.pytest[i].dateId === dateGen) {
                            skip = true;
                        }
                    }
                    let paid = temppatients.paymentlogs[dateGen] != undefined &&
                        temppatients.paymentlogs[dateGen].pay === true ? true:false;
                    if((!paid || tdini.year == now.year && tdini.month == now.month) && !startPrinting){
                        //skip = true;
                        //console.log("Has payment for "+dateGen,temppatients.paymentlogs[dateGen]);
                        startPrinting = true;
                    }
                    
                    let status = 0; //normal;
                   if( tdini.year == now.year && tdini.month == now.month){
                       status = 1; //current month
                   }
                   if (tdini.year < now.year || (tdini.year === now.year && tdini.month < now.month)) {
                       status = 2; //past due
                   }
                   if( tdini.year >= now.year && tdini.month > now.month){
                       status = 3; //future due
                   }
                    let deudames = temppatients.paymentlogs[dateGen]?.debt ?? 0;
                    if(!skip && startPrinting){
                        temppatients.pytest.push({
                            dateId: dateGen,
                            status: status,
                            tdini: tdini,
                            check: temppatients.pytest.length == 0 ? true : false,
                            pay: paid,
                            datedisplay: datePretty,
                            id: id,
                            debt: deudames,
                        });
                    }

                    // if (
                    //     temppatients.paymentlogs[dateGen] != undefined &&
                    //     temppatients.paymentlogs[dateGen].pay === false &&
                    //     skip === false
                    // ) {
                    //     let deudames = temppatients.paymentlogs[dateGen].debt;
                    //     temppatients.pytest.push({
                    //         dateId: dateGen,
                    //         tdini: tdini,
                    //         check: index == 0 ? true : false,
                    //         pay: paid,
                    //         datedisplay: datePretty,
                    //         id: id,
                    //         debt: deudames,
                    //     });
                    // } else if (
                    //     temppatients.paymentlogs[dateGen] != undefined &&
                    //     temppatients.paymentlogs[dateGen].pay === true
                    // ) {
                    //     temppatients.pytest.push({
                    //         dateId: dateGen,
                    //         tdini: tdini,
                    //         id: id,
                    //         pay: paid,
                    //         datedisplay: datePretty,
                    //     });
                    // } else if (skip === false) {
                    //     temppatients.pytest.push({
                    //         dateId: dateGen,
                    //         tdini: tdini,
                    //         check: index == 0 ? true : false,
                    //         pay: paid,
                    //         datedisplay: datePretty,
                    //         id: id,
                    //     });
                    // }
                    tdini = tdini.plus({ months: 1 });
                    id++;
                }

                //console.log(temppatients.pytest);
                // console.log(guests);
            });

            await tick();
            if (datatable == undefined) {
                loadData();
            } else {
                //datatable.clear();
            }

            //datatable.rows('dom').invalidate().draw(false);
        });
    }
    /*if (guestsIds != undefined) {
        for (let index = 0; index < guestsIds.length; index++) {
            db.collection("guest_payments")
                .where("id", "==", guestsIds[index])
                .get()
                .then(async (querySnapshot) => {
                    const tmp = [];

                    querySnapshot.forEach((doc) => {
                        // console.log(`${doc.id} => ${doc.data()}`);
                        const temppositions = doc.data();
                        temppositions.id = doc.id;
                        tmp.push(temppositions);
                    });
                    guest_payments = tmp;
                    console.log(guest_payments);
                });
        }

        {#if pidx == 0 || row.pytest[pidx - 1].check}
    }*/

    function deleteDoc(id) {
        Swal.fire({
            title: "¿Esta seguro?",
            text: "Desea eliminar este registro",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Si, borrarlo!",
        }).then(function (result) {
            if (result.value) {
                db.collection("guest_payments").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
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
                });
        }
    }

    function addPayments(pid) {
        let paymentsparams = [];

        

        let guest = guests.find(guest => guest.id === pid);

        let paymentsArray = guest.pytest.filter(
            (payments) => (payments.check == true && payments.pay != true)
        );

        paymentsArray.forEach(({ dateId }) => paymentsparams.push(dateId));

        let pids = paymentsparams.join(",");
        if(guest.introcheck){
            pids = "intro/1";

        }
        if(paymentsparams.length == 0){
            Swal.fire({
                title: "Error",
                text: "Debe seleccionar al menos un pago",
                type: "warning",
                cancelButtonColor: "#f46a6a",
            });
            return;
        }

        window.location.href = "#/addguest_payments/" + pid + "/" + pids + "/";
    }

    function addPayment(pid) {
        let paymentsparams = [];

        

        let guest = guests.find(guest => guest.id === pid);

        let paymentsArray = guest.pytest.filter(
            (payments) => payments.check == true
        );

        paymentsArray.forEach(({ dateId }) => paymentsparams.push(dateId));

        let pids = paymentsparams.join(",");

        window.location.href = "#/addguest_payment/" + pid + "/";
    }
    function moveAdded(pid){
        let guest = guests.find(guest => guest.id === pid);
        Swal.fire({
            title: "Confirmación",
            text: "Está seguro que desea mover la fecha de registro de "+guest.name+" a hoy?",
            type: "warning",
            cancelButtonColor: "#f46a6a",
        }).then(function (result) {
        if (result.value) {
            db.collection('patients').doc(pid).update({added: new Date()});
        }});
    }

    function historyPayments(pid) {
        window.location.href = "#/newguest_paymentshistory/" + pid + "/";
    }
    function addNewPayments(pid) {
        window.location.href = "#/addnew_payments/" + pid + "/";
    }
    let editId = "";
    let editName = "";
    let newAdded = DateTime.local().toISODate();
    function setEditId(patient) {
        // editData = { field: filterName, value: filterValue, bid: eId };
        // showModal = true;
        editId = patient.id;
        editName = patient.name;
        newAdded = DateTime.local().toISODate();
        jQuery("#activateModalScrollable").modal("show");
    }

    function verifyPayment(patient){
        if(patient.status == 3 && patient.sepationPercentage >= 100){

            setEditId(patient);
            return;
        }
        addNewPayments(patient.id);
    }
    function updateAdded(){
        if(newAdded == undefined || newAdded == "" || editId == ""){
            return;
        }
        console.log(newAdded, editId);
        let entrydate = DateTime.fromISO(newAdded).startOf("day").plus({month:1}).toISODate();
        let addedDate = DateTime.fromISO(newAdded).startOf("day").toJSDate();
        db.collection('patients').doc(editId).update({added: addedDate,entrydate:entrydate, status:0});
        jQuery("#activateModalScrollable").modal("hide");
    }
    function cancel(){
        editId = "";
        jQuery("#activateModalScrollable").modal("hide");
    }
</script>

<div class="page-content">
    <TitleBar title="Pagos huespedes" base="Inventario" />
    <div class="">
        <p>
            <BranchesSearchList bind:value={filterValue} inlist={!hasEdit} />
        </p>
    </div>
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración Pagos huespedes (Huespedes Activos = {guests.filter(row => row.branch === filterValue).length})</h4>

                    <div class="flex flex-col bg-slate-100 p-2 gap-4 w-full">
                        {#each guests as row}
                        {#if row.branch == filterValue}
                            <div class="flex flex-col p-4 gap-4 bg-white shadow-md rounded-md">
                                <div class="flex flex-row gap-4 items-center w-full">
                                    <a class="text-xl" href={"/editpatients/"+row.id} use:link target="_blank" rel="noreferrer">{row.name}</a>
                                    <div class="grow"></div>
                                    <div>Mensualidad: ${row.monthcost != null ? `$${row.monthcost.toLocaleString("es-MX")}` : ''}</div>
                                </div>
                                <div class="flex flex-row gap-4">
                                    {#if row.status == 3}
                                    <div class="flex flex-col gap-2 items-center">
                                        Separación
                                        <div class="{row.sepationPercentage == 100 ? 'bg-green-100 text-green-600 shadow-md shadow-green-400':'bg-yellow-100 text-yellow-600 shadow-yellow-400'}  shadow-md size-12 rounded-full text-xl flex items-center justify-center">
                                           {#if row.sepationPercentage == 100}
                                                <iconify-icon icon="mdi:check"></iconify-icon>
                                            {:else}
                                                {Number(row.sepationPercentage).toFixed(2)}%
                                            {/if}
                                        </div>
                                        
                                    </div>
                                    {/if}
                                    {#if row.introcost > 0 && row.introcheck}
                                    <div class="flex flex-col gap-2 items-center">
                                        Inscripción
                                        <div class="bg-yellow-100 text-yellow-600 shadow-md shadow-yellow-400  size-12 rounded-full text-xl flex items-center justify-center">
                                            {#if row.intromode == 0}
                                                0/1
                                            {:else if row.intromode == 1}
                                                0/2
                                            {:else if row.intromode == 2}
                                                0/3
                                            {/if}
                                        </div>
                                        {#if row.introNextPayment != undefined}
                                            <span class="text-xs">Proximo Pago:</span>
                                            {timeToAgo(row.introNextPayment)}
                                        {/if}
                                    </div>
                                    {/if}
                                    {#if row.status == 0}
                                        <PaymentStatus patientId={row.id} />
                                    {/if}
                                </div>
                                <div class="flex flex-row gap-4">
                                   
                                        <button 
                                        on:click={() => verifyPayment(row)}
                                        type="button" class="btn bg-slate-200 text-slate-600 rounded-md w-full text-xs flex flex-row gap-2 items-center">
                                            {#if row.status == 3 && row.sepationPercentage >= 100}
                                                <iconify-icon icon="mdi:check" class="text-xl"></iconify-icon>
                                                Ingresar paciente
                                            {:else}    
                                                <iconify-icon icon="mdi:plus" class="text-xl"></iconify-icon>
                                                Agregar Pago
                                            {/if}
                                        </button>
                                    
                                    <button 
                                    on:click={() => historyPayments(row.id)}
                                    type="button" class="btn bg-slate-100 text-slate-600 rounded-md w-full text-xs flex flex-row gap-2 items-center">
                                        <iconify-icon icon="mdi:wallet-bifold-outline" class="text-xl"></iconify-icon>
                                        Historial Pagos
                                    </button>
                                </div>
                            </div>
                        {/if}
                        {/each}


                    </div>
                    <!-- <table
                        id="guest_payments-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Nombre Residente: </th>
                                <th>Costo mensual: </th>
                                <th>Pagos</th>
                                <th>Acciones</th>
                                <th>Historial de Pagos</th>
                            </tr>
                        </thead>

                        <tbody>
                            {#each guests as row (row.id)}
                                {#if row.branch == filterValue}
                                    <tr
                                        in:receive={{ key: row.id }}
                                        out:send={{ key: row.id }}
                                    >
                                        <td><a href={"/editpatients/"+row.id} use:link target="_blank" rel="noreferrer">{row.name}</a> 
                                        <br>
                                        Fecha de Alta: {row.entrydateFormatted}</td>
                                        <td>${row.monthcost}</td>
                                        <td style="padding: 0;">
                                            <table class="w-100">
                                                {#if row.introcheck}
                                                <tr>
                                                    <td>
                                                        Inscripción<br />
                                                        Proximo Pago: {timeToAgo(row.introNextPayment)}
                                                    </td>
                                                    <td>
                                                    <input
                                                            type="checkbox"
                                                            disabled
                                                            bind:checked={row.introcheck}
                                                        />
                                                    </td>
                                                        <td>
                                                            Por pagar ${row.introcost - row.intropaid}</td
                                                        >
                                                </tr>
                                                {/if}
                                        {#each row.pytest as pago, pidx}
                                            <tr
                                                style={pago.status == 2 && !pago.pay
                                                    ? "background-color:#FA5447;color:white"
                                                    : pago.status == 1 && !pago.pay
                                                    ? "background-color:#F7FBB4"
                                                    : pago.status == 3
                                                    ? "background-color:#DCF5B3"
                                                    : ""}
                                            >
                                                <td>{pago.datedisplay}</td>
                                                <td>
                                                    {#if !pago.pay}
                                                        <input

                                                            type="checkbox"
                                                            disabled={pago.pay || (pidx > 0 && !row.pytest[pidx - 1].check)}
                                                            bind:checked={pago.check}
                                                        />
                                                    {/if}
                                                </td>
                                                    
                                                <td>
                                                    {#if pago.pay}
                                                        Pagado
                                                    {:else if pago.status == 0}
                                                        -
                                                    {:else if !pago.pay && pago.debt == 0}
                                                        Por pagar
                                                    {:else if !pago.pay}
                                                        ${pago.debt}{/if}</td
                                                >
                                            </tr>
                                        {/each}
                                    </table>
                                    </td>
                                        <td>
                                            <button
                                                on:click={() =>
                                                    addPayments(row.id)}
                                                class="btn btn-light waves-effect"
                                                >Pagar</button>
                                                <br />
                                                <br />
                                                <button
                                                on:click={() =>
                                                    addPayment(row.id)}
                                                class="btn btn-light waves-effect"
                                                >Pago Especial</button>
                                                <br />
                                                <br />
                                                {#if $permissions.admin}
                                                 <button
                                                on:click={() =>
                                                    moveAdded(row.id)}
                                                class="btn btn-light waves-effect"
                                                >Mover fecha de registro</button>
                                                {/if}
                                        </td>
                                        <td>Pagos Realizados: {row.paymentlogs !=undefined? Object.keys(row.paymentlogs).length:0}<br />
                                            <button
                                                on:click={() =>
                                                    historyPayments(row.id)}
                                                class="btn btn-light waves-effect"
                                                >Historial de Pagos</button
                                            >
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table> -->
                </div>
            </div>
        </div>
        <!-- end col -->
    </div>
    <!-- end row -->
</div>

<!-- Guest payments table month -->
 <div class="grid grid-cols-5 gap-2 card m-4 p-4">
    <div>Nombre</div>
    <div>Mensualidad</div>
    <div>Folio</div>
    <div>Pago</div>
    <div>Fecha</div>
{#each guests as row}
    {#if row.branch == filterValue}
        {#each recipt_payments as pay}
            {#if pay.guestid == row.id}
                <div>{row.name}</div>
                <div>${row.monthcost.toLocaleString("es-MX")}</div>
                <div>3{pay.folio}</div>
                <div>${pay.total.toLocaleString("es-MX")}</div>
                <div>{pay.added.toDate().toLocaleString()}</div>
            {/if}
        {/each}
    {/if}
{/each}
</div>
<div
                        class="modal fade"
                        id="activateModalScrollable"
                        tabindex="-1"
                        role="dialog"
                        aria-labelledby="activateModalScrollableTitle"
                        aria-hidden="true"
                    >
                        <div class="modal-dialog modal-dialog-scrollable">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5
                                        class="modal-title mt-0"
                                        id="activateModalScrollableTitle"
                                    >
                                        Activar huesped 
                                    </h5>
                                    <button
                                        type="button"
                                        class="close"
                                        on:click={() => {
                                            jQuery(
                                                "#activateModalScrollable"
                                            ).modal("hide");
                                            showModal = false;
                                        }}
                                        aria-label="Close"
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="flex flex-col gap-4 p-4">
                                    <div class="form-group row">
                                        <label for="registrydate" class="col-md-4 col-form-label"
                                        >Fecha de Ingreso</label
                                        >
                                        <div class="col-md-8">
                                        <input
                                            class="form-control"
                                            type="date"
                                            bind:value={newAdded}
                                            id="registrydate"
                                            
                                            required
                                        />
                                        </div>
                                    </div>
                                    <div class="flex flex-row gap-4">
                                        <button
                                            on:click={updateAdded}
                                            class="btn btn-primary waves-effect waves-light"
                                            disabled={loading}
                                        >
                                            {#if loading}<i
                                                class="bx bx-loader bx-spin font-size-16 align-middle mr-2"
                                            />{/if}
                                            Guardar</button
                                        >
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
                            <!-- /.modal-content -->
                        </div>
                        <!-- /.modal-dialog -->
                    </div>

<svelte:head>
    <link href="assets/css/output.css" rel="stylesheet" />
</svelte:head>