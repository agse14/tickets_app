<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile } from "../stores.js";
    import PatientsEdit from "./PatientsEdit.svelte";

    import { billing_period as patients_billing_period } from "../controls/patients.js";
    import { branches } from "../controls/branches.js";
    import BranchSearchList from "../controls/BranchSearchList.svelte";
    import PatientsItemsListSelect from "../controls/PatientsItemsListSelect.svelte";
    import ItemsOptions from "../controls/ItemsOptions.svelte";
    import { medical_service as patients_medical_service } from "../controls/patients.js";
    import { room_inventory } from "../controls/room_inventory.js";
    import RoomSearchList from "../controls/RoomSearchList.svelte";
    import { status as patients_status } from "../controls/patients.js";
    import { staytype as patients_staytype } from "../controls/patients.js";

    function checkVisibles() {}

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { flip } from "svelte/animate";

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

    export let params = {};
    export let loadDataTable = true;
    export let modal = true;
    //array [0 = doc field, 1=profile field]
    export let profileFilter = null;
    export let hasAdd = true;
    export let hasEdit = true;

    let patients = [];

    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let loading = false;
    let showModal = false;
    let totals = {};
    let NameBranch;
    let end = DateTime.local().toISODate();
    let start = DateTime.local().minus({ days: 30 }).toISODate();

    $: start, end,loadFirebaseData();

    let filterName = params.field;
    let filterValue = params.value;

    let editData = { field: filterName, value: filterValue, bid: undefined };

    onDestroy(() => {
        if (datatable != undefined && datatable != null) {
            datatable.clear();
            datatable.destroy();
            datatable = undefined;
        }
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
            unsubscribe = undefined;
        }
    });

    if (profileFilter !== null) {
        unsubscribeProfile = profile.subscribe((value) => {
            if (value == undefined && !$permissions.admin) {
                console.log("no profile");
                return;
            }
            if (!$permissions.admin && !$permissions.patients) {
                console.log("not admin", value);

                filterName = profileFilter[0];
                filterValue =
                    value != undefined ? value[profileFilter[1]] ?? "" : "";
            }
            // else{
            //     hasEdit = true;
            // }
            loadFirebaseData();
        });
    } else {
        loadFirebaseData();
    }
    function loadData() {
        if (!loadDataTable) {
            return;
        }
        datatable = jQuery("#patients-dt").DataTable({
            destroy: true,
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Pacientes", "25 Pacientes", "50 Pacientes", "Todo"],
            ],
            data: patients,
            createdRow: function (row, data, index) {},
            columns: [
                {
                    data: "name",
                    name: "Nombre del huésped",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        return html(
                            '<a href="#/editpatients/' +
                                id +
                                '">' +
                                data +
                                "</a>"
                        );
                    },
                },
                { data: "statusName", name: "Estatus" },
                {
                    data: "entrydate",
                    name: "Fecha de ingreso",
                    render: function (data, type, row, meta) {
                        return html(
                                data
                        );
                    },
                },
                {
                    data: "dischargedate",
                    name: "Fecha de baja",
                    render: function (data, type, row, meta) {
                        if(data != undefined){
                            return html(
                                data
                            );
                        }
                        return "";
                    },
                },
                { data: "branchName", name: "Sucursal" },
                { data: "roomName", name: "Cuarto Asignado" },
                {
                    data: "monthcost",
                    render: function (data, type, row, meta) {
                        // Redondea a dos decimales SIEMPRE
                        let num = Number(data);
                        if (isNaN(num)) num = 0;
                        num = Math.round(num * 100) / 100;
                        if (type === "display" || type === "filter") {
                            return num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        // Para exportar y ordenar, devuelve el número puro redondeado
                        return num;
                    },
                },
                {
                    data: "iva",
                    name: "Iva",
                    render: function (data, type, row, meta) {
                        if (row.iva == true) {
                            return "Si";
                        } else {
                            return "No";
                        }
                    },
                },
                {
                    data: "impuestos",
                    render: function (data, type, row, meta) {
                        // Redondea a dos decimales SIEMPRE
                        let num = Number(row.impuestos);
                        if (isNaN(num)) num = 0;
                        num = Math.round(num * 100) / 100;
                        if (type === "display" || type === "filter") {
                            return num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        // Para exportar y ordenar, devuelve el número puro redondeado
                        return num;
                    },
                },
                {
                    data: "monthsubTotal",
                    render: function (data, type, row, meta) {
                        // Redondea a dos decimales SIEMPRE
                        if (row.monthsubTotal == undefined) {
                            row.monthsubTotal = 0;
                        }
                        let num = Number(row.monthsubTotal);
                        if (isNaN(num)) num = 0;
                        num = Math.round(num * 100) / 100;
                        if (type === "display" || type === "filter") {
                            return num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        }
                        // Para exportar y ordenar, devuelve el número puro redondeado
                        return num;
                    },
                }
            ],
            rows: [],
            language: {
                lengthMenu: "Ver _MENU_",
                info: "Mostrando _PAGE_ de _PAGES_ páginas",
                search: "Buscar:",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior",
                },
            },
            buttons: [
                // 'copy', 'csv', 'pdf'
                {
                    extend: "copy",
                    filename: "Reporte de Pacientes",
                },
                {
                    extend: "excel",
                    filename: "Reporte de Pacientes",
                },
                {
                    extend: "pdf",
                    filename: "Reporte de Pacientes",
                },
            ],
            responsive: true,
            scrollX: true,
        });

        datatable
            .buttons()
            .container()
            .appendTo("#patients-dt_wrapper .col-md-6:eq(0)");
    }
    function loadFirebaseData() {
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
            unsubscribe = undefined;
        }
        let newend = DateTime.fromISO(end).endOf("day");
        let newStart = DateTime.fromISO(start).startOf("day");
        // console.log(newend);

        let query = db.collection("patients");
        if (filterName != undefined && filterValue != undefined) {
            console.log("filter : " + filterName + " == " + filterValue);
            query = query.where(filterName, "==", filterValue);
        }
        // console.log(newend);
        unsubscribe = query
            .where("entrydate", "<=", newStart.toISODate())
            .orderBy("entrydate", "desc")
            .onSnapshot( (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    const temppatients = doc.data();
                    temppatients.id = doc.id;
                    if (temppatients.dischargedate != undefined) {
                        let dischargedate = DateTime.fromISO(
                            temppatients.dischargedate
                        );
                        if (dischargedate < newend) {
                            return;
                        }
                    }
                    
                    // console.log(`${doc.id} => ${doc.data()}`);
                    
                    temppatients.did = doc.id;
                    temppatients.statusName =
                        temppatients.status != undefined &&
                        patients_status[temppatients.status] != undefined
                            ? patients_status[temppatients.status]
                            : "";
                    if (temppatients.monthcost == undefined) {
                        temppatients.monthcost = 0;
                    }

                    temppatients.branchName = "";
                    $branches.forEach((element) => {
                        if (element.id == temppatients.branch) {
                            temppatients.branchName = element.name;
                        }
                        // Se crea array para totales
                        if (!(element.name in totals)) {
                            if (
                                element.name == temppatients.branchName &&
                                temppatients.monthcost != 0 &&
                                temppatients.branchName != ""
                            ) {
                                if (
                                    totals[temppatients.branchName] == undefined
                                ) {
                                    totals[temppatients.branchName] = 0;
                                }
                            }
                        }
                        if (
                            element.name == temppatients.branchName &&
                            temppatients.status == 0
                        ) {
                            totals[temppatients.branchName] +=
                                temppatients.monthcost;
                        }
                    });
                    // console.log(totals);
                    temppatients.impuestos = "0";
                    temppatients.monthsubTotal = "0";
                    if (temppatients.iva == true) {
                        temppatients.monthsubTotal =
                            temppatients.monthcost / 1.16;
                        temppatients.impuestos =
                            temppatients.monthsubTotal * 0.16;
                        // console.log(temppatients.impuestos," ", temppatients.monthsubTotal);
                    } else {
                        temppatients.impuestos = 0;
                        temppatients.monthsubTotal = temppatients.monthcost * 1;
                    }

                    temppatients.roomName = "";
                    $room_inventory.forEach((element) => {
                        if (element.id == temppatients.room) {
                            temppatients.roomName = element.name;
                        }
                    });

                    tmp.push(temppatients);
                    // console.log(tmp);
                });
                // tmp.push(totals)
                // console.log(tmp);
                patients = tmp;
                tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(patients).draw(false);
                }
            });
    }

    function html(data) {
        return data;
    }
    function setEditId(eId) {
        editData = { field: filterName, value: filterValue, bid: eId };
        showModal = true;
        jQuery("#editModalScrollable").modal("show");
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
                db.collection("patients").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("patients").doc(id).update(update);
    }
    window.setEditId = setEditId;
    window.deleteDoc = deleteDoc;
    window.asyncChange = asyncChange;

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
</script>

<div class="page-content">
    <TitleBar title="Pacientes" base="Inventario" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Reporte Pacientes</h4>
                    {#if filterName != undefined && filterValue != undefined}
                        <FilterName
                            node={profileFilter != null
                                ? profileFilter[1]
                                : filterName}
                            value={filterValue}
                        />
                    {/if}
                    <div class="row" >
                        <div class="col-6 no-print">Seleccione Inicio<br />
                        <input type="date" class="form-control" name="start" id="start" bind:value={start} />
                        </div>
                        <div class="col-6 no-print">Seleccione Fin<br />
                            <input type="date" class="form-control" name="end" id="end" bind:value={end} />
                            </div>
                    </div>

                    <table
                        id="patients-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Nombre del huésped</th>
                                <th>Estatus Actual</th>
                                <th>Fecha de ingreso</th>
                                <th>Fecha de baja</th>
                                <th>Sucursal</th>
                                <th>Cuarto Asignado</th>
                                <th>Costo mensual</th>
                                <th>Impuestos</th>
                                <th>Iva</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>

                        <tbody />
                    </table>

                    <div
                        class="modal fade"
                        id="editModalScrollable"
                        tabindex="-1"
                        role="dialog"
                        aria-labelledby="editModalScrollableTitle"
                        aria-hidden="true"
                    >
                        <div class="modal-dialog modal-dialog-scrollable">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5
                                        class="modal-title mt-0"
                                        id="editModalScrollableTitle"
                                    >
                                        Agregar Paciente
                                    </h5>
                                    <button
                                        type="button"
                                        class="close"
                                        on:click={() => {
                                            editData = {
                                                field: filterName,
                                                value: filterValue,
                                                bid: undefined,
                                            };
                                            jQuery(
                                                "#editModalScrollable"
                                            ).modal("hide");
                                            showModal = false;
                                        }}
                                        aria-label="Close"
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                {#if showModal}
                                    <PatientsEdit
                                        params={editData}
                                        onBack={() => {
                                            editData = {
                                                field: filterName,
                                                value: filterValue,
                                                bid: undefined,
                                            };
                                            jQuery(
                                                "#editModalScrollable"
                                            ).modal("hide");
                                            showModal = false;
                                        }}
                                    />
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
