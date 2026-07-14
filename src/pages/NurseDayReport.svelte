<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { routes } from "../menu";
    import { permissions, profile} from "../stores.js";
    import { fun } from "../callable";

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";

    import BranchesSearchList from "../controls/BranchesSearchList.svelte";

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
    let nursery = {};
    let datatable;
    let unsubscribe;
    let unsubscribeNursery;

    let loading = false;

    let filterName = params.field;
    let filterValue = params.value;

    let now = DateTime.local().setLocale("es-mx");
    let cdate = DateTime.local()
            .setLocale("es-mx").startOf('week');
    let weekNew = [];

    function prevWeek(){
        cdate = cdate.minus({days: 7});
        // console.log(cdate);
        initWeek();
    }       

    function nextWeek(){
        cdate = cdate.plus({days: 7});
        // console.log(cdate);
        initWeek();
    } 

    function initWeek() {
        //let dayId = cdate.toISODate();
        //ESTO solo jala cuando ya se habia asignado una semana
        // for (let wd = 0; wd < weekNew.length; wd++) {
        //     const element = weekNew[wd];
        //     if(element.unsub != undefined){
        //         element.unsub();
        //         element.unsub = null;
        //     }
        // }

        //reseteo la semana
        weekNew = [];
        // me voy del lunes al dia 7
        for (let index = 0; index < 7; index++) {
            // al dia de inicio de semana le sumo index dias
            let dayNext = cdate.plus({days: index});
            //saco el id
            const dId = dayNext.toISODate();
            weekNew.push({
                date: dayNext,
                id: dId,
                //unsub: unsubwek,
                asigned:[],
                added:false,
                loading: true
            });

        }
    }

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
		if(!$permissions.admin && !$permissions.accounting){
            console.log("not admin",value);

            filterName = 'branch';
            filterValue = value?.branches ?? '';
        }else{
            hasEdit = true;
        }
        loadFirebaseData();
	});

    onMount(() => {});
    onDestroy(() => {
        if (datatable != undefined && datatable != null) {
            datatable.destroy();
        }
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
        }
        if (unsubscribeNursery != null && unsubscribeNursery != undefined) {
            unsubscribeNursery();
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
    function loadFirebaseData(){
        initWeek();
    let query = db.collection("patients");
    let queryNursery = db.collection("nursery");
    if (filterName != undefined && filterValue != undefined) {
        //console.log("filter : " + filterName + " == " + filterValue);
        query = query.where(filterName, "==", filterValue);
        queryNursery = query.where(filterName, "==", filterValue);
    }

    unsubscribe = query
        .orderBy("name")
        .onSnapshot(async (querySnapshot) => {
            const tmp = [];

            separateWeeks(querySnapshot);
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);

                const temppatients = doc.data();
                
                if(temppatients.status == 1 || temppatients.status == 2){
                    // console.log("baja ",temppatients);
                    return;
                }
                temppatients.id = doc.id;
                
                //console.log(temppatients);
                tmp.push(temppatients);

                //let td; //testdate

                

                
            });
            guests = tmp;

        });

        unsubscribeNursery = queryNursery.where("date",">=",weekNew[0].date.toISODate())
                                    .where("date","<=",weekNew[6].date.toISODate())
                                    .onSnapshot(async (querySnapshot) => {
            const tmp = [];
            nursery = {};

            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);

                const temppatients = doc.data();
                
                temppatients.id = doc.id;
                
                //console.log(temppatients);
                //tmp.push(temppatients);
                if(nursery[temppatients.patientName] == undefined){
                    nursery[temppatients.patientName] = {}; 
                }
                nursery[temppatients.patientName][temppatients.date] = temppatients;
                //let td; //testdate

                

                
            });

            console.log("nursery ",nursery);

            
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

    function viewNursery(pid) {

        // let guest = guests.find(guest => guest.id === pid);

        window.location.href = "#/nursery/patientName/" + pid + "/";
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
        window.location.href = "#/guest_paymentshistory/" + pid + "/";
    }
</script>

<div class="page-content">
    <TitleBar title="Reportes de enfermería" base="Pacientes" />
    <div class="">
        <p>
            <BranchesSearchList bind:value={filterValue} inlist={!hasEdit} />
        </p>
    </div>
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Reportes de enfermería diarios</h4>
                    <div class="row mb-4">
                        <div class="col"></div>
                        <!-- <div class="col-1"><a href="javascript:void(0);" class="btn btn-light waves-effect" on:click={()=>{ prevWeek() }}><i class="bx bx-chevron-left font-size-16 align-middle"></i></a></div> -->
                        <div class="col-5"><h4>Reportes para el {weekNew[0].date.day} de {weekNew[0].date.monthLong}</h4></div>
                        <!-- <div class="col-1"><a href="javascript:void(0);" class="btn btn-light waves-effect" on:click={()=>{ nextWeek() }}><i class="bx bx-chevron-right font-size-16 align-middle"></i></a></div> -->
                        <div class="col"></div>
                    </div>
                    <table
                        id="guest_payments-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Nombre Residente </th>
                                <th>Reportes</th>
                            </tr>
                        </thead>

                        <tbody>
                            {#each guests as row (row.id)}
                                {#if row.branch == filterValue}
                                    <tr
                                        in:receive={{ key: row.id }}
                                        out:send={{ key: row.id }}
                                    >
                                        <td><a href={"/editpatients/"+row.id} use:link target="_blank">{row.name}</a> </td>
                                        <td>
                                            <div class="row mb-2">
                                                <div class="col mb-2">
                                                    <a href={"/addnursery/branch/"+row.branch+"/patientName/"+row.id} use:link class="avatar-title {nursery[row.id] != undefined && nursery[row.id][weekNew[0].id] != undefined ? 'bg-soft-success text-success':'bg-soft-primary text-primary'} rounded text-center p-2">
                                                        <div class="row">
                                                            <div class="col-12">
                                                                <i class="mdi {nursery[row.id] != undefined && nursery[row.id][weekNew[0].id] != undefined == true? 'mdi-check':'mdi-plus'}"></i>
                                                            </div>
                                                            <div class="col-12">
                                                                {weekNew[0].date.weekdayShort} {weekNew[0].date.day}
                                                            </div>
                                                            
                                                        </div>
                                                        </a>
                                                    
                                                </div>
                                        </div>
                                    </td>
                                    </tr>
                                {/if}
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
