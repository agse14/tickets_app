<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile } from "../stores.js";
    import PartnersEdit from "./PartnersEdit.svelte";

    import PartnersActivities_advancedListSelect from "../controls/PartnersActivities_advancedListSelect.svelte";
    import Activities_advancedOptions from "../controls/Activities_advancedOptions.svelte";
    import PartnersActivities_auxListSelect from "../controls/PartnersActivities_auxListSelect.svelte";
    import Activities_auxOptions from "../controls/Activities_auxOptions.svelte";
    import PartnersActivities_basicListSelect from "../controls/PartnersActivities_basicListSelect.svelte";
    import Activities_basicOptions from "../controls/Activities_basicOptions.svelte";
    import PartnersActivities_generalListSelect from "../controls/PartnersActivities_generalListSelect.svelte";
    import Activities_generalOptions from "../controls/Activities_generalOptions.svelte";
    import { branches } from "../controls/branches.js";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { civil as partners_civil } from "../controls/partners.js";
    import { contact_relation as partners_contact_relation } from "../controls/partners.js";
    import { contact_relation_2 as partners_contact_relation_2 } from "../controls/partners.js";
    import { contact_relation_3 as partners_contact_relation_3 } from "../controls/partners.js";
    import { contact_relation_eme as partners_contact_relation_eme } from "../controls/partners.js";
    import PartnersDocs_containsListSelect from "../controls/PartnersDocs_containsListSelect.svelte";
    import Docs_containsOptions from "../controls/Docs_containsOptions.svelte";
    import ImageField from "../controls//ImageField.svelte";
    import { gender as partners_gender } from "../controls/partners.js";
    import PartnersHabitsListSelect from "../controls/PartnersHabitsListSelect.svelte";
    import HabitsOptions from "../controls/HabitsOptions.svelte";
    import { paymentperiod as partners_paymentperiod } from "../controls/partners.js";
    import { payroll as partners_payroll } from "../controls/partners.js";
    import { positions } from "../controls/positions.js";
    import PositionsSearchList from "../controls/PositionsSearchList.svelte";
    import { study as partners_study } from "../controls/partners.js";
    import { type as partners_type } from "../controls/partners.js";

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

    let partners = [];

    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let loading = false;
    let showModal = false;

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
            if (!$permissions.admin && !$permissions.partners) {
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
        datatable = jQuery("#partners-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Empleados", "25 Empleados", "50 Empleados", "Todo"],
            ],
            data: partners,
            createdRow: function (row, data, index) {},
            order: [[1, "asc"]],
            columns: [
                {
                    data: "active_service",
                    name: "Activo",
                    render: function (data, type, row, meta) {
                        return data === true ? "Si" : "No";
                    },
                },
                {
                    data: "name",
                    name: "Nombre",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        return html(
                            '<a href="#/editpartners/' +
                                id +
                                '">' +
                                row.name +
                                " " +
                                row.lastname +
                                "</a>"
                        );
                    },
                },
                // { data: 'lastname', render: function (data, type, row, meta) {
                //     return ''+(data != undefined?data:'');
                //     },
                // },
                // {
                //     data: "email",
                //     render: function (data, type, row, meta) {
                //         return "" + (data != undefined ? data : "");
                //     },
                // },
                // {
                //     data: "birth",
                //     name: "Fecha de Nacimiento",
                //     render: function (data, type, row, meta) {
                //         return data ? formatBirthDate(data) : "";
                //     },
                // },
                {
                    data: "birth",
                    name: "Fecha de Nacimiento",
                    render: function (data, type, row, meta) {
                        return data ? data : ""; // Mostrar la fecha si está capturada, de lo contrario, cadena vacía
                    },
                },
                {
                    data: "pay",
                    visible: false,
                    render: function (data, type, row, meta) {
                        return "" + (data != undefined ? data : "");
                    },
                },
                {
                    data: "branchesName",
                    visible: false,
                    render: function (data, type, row, meta) {
                        return "" + (data != undefined ? data : "");
                    },
                },
                {
                    data: "active_date",
                    visible: false,
                    render: function (data, type, row, meta) {
                        return "" + (data != undefined ? data : "");
                    },
                },
                {
                    data: "active_date_off",
                    visible: false,
                    render: function (data, type, row, meta) {
                        return "" + (data != undefined ? data : "");
                    },
                },
                // {
                //     data: "active",
                //     name: "Activo en Medi",
                //     render: function (data, type, row, meta) {
                //         return data === true ? "Si" : "No";
                //     },
                // },
                // {
                //     data: "inbranch",
                //     name: "En Estancia",
                //     render: function (data, type, row, meta) {
                //         return data === true ? "Si" : "No";
                //     },
                // },
                // {
                //     data: "did",
                //     name: "Acciones",
                //     render: function (data, type, row, meta) {
                //         let buttons = "";
                //         if (hasEdit) {
                //             if (modal) {
                //                 buttons +=
                //                     '<button type="button" class="btn btn-light waves-effect" onclick="setEditId(\'' +
                //                     data +
                //                     '\');"><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>';
                //             } else {
                //                 buttons +=
                //                     '<a href="#/editpartners/' +
                //                     data +
                //                     '" class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
                //             }
                //         }
                //         return html(
                //             buttons +
                //                 "<button onclick=\"deleteDoc('" +
                //                 data +
                //                 '\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button>'
                //         );
                //     },
                // },
            ],
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
                "copy",
                {
                    extend: "excel",
                    text: "Excel",
                    filename: "Cumpleaños de Empleados",
                    exportOptions: {
                        rows: function (idx, data, row) {
                            // console.log(data);
                            return data["active_service"] === true;
                        },
                    },
                },
                {
                    extend: 'pdf',
                    text: 'PDF',
                    filename: "Cumpleaños de Empleados",
                    exportOptions: {
                        rows: function (data, type, row,){
                            console.log(data);
                            return data["active_service"] === true;
                        }
                        // rows: partners.filter(row => row.active_service === true)
                    }
                }
            ],
            // buttons: ['copy', 'excel', 'pdf'],
            responsive: true,
            scrollX: true,
        });
        
        // Aplicar un filtro para mostrar solo las filas con fecha de nacimiento capturada
        datatable.column(2).search('[^\\s]', true, false);

        // // Obtener el mes actual (0-11, donde 0 es enero y 11 es diciembre)
        // var fechaActual = new Date();
        // var mesActual = fechaActual.getMonth() + 1; // Agregar 1 porque los meses se indexan desde 0

        // // Filtrar por el mes actual
        // datatable.column(2).search('^\\d{4}-' + (mesActual < 10 ? '0' : '') + mesActual + '-', true, false);

        datatable.draw();

        datatable
            .buttons()
            .container()
            .appendTo("#partners-dt_wrapper .col-md-6:eq(0)");
    }
    function loadFirebaseData() {
        let query = db.collection("partners");
        if (filterName != undefined && filterValue != undefined) {
            console.log("filter : " + filterName + " == " + filterValue);
            query = query.where(filterName, "==", filterValue);
        }

        unsubscribe = query
            .orderBy("added", "desc")
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    // console.log(`${doc.id} => ${doc.data()}`);
                    const temppartners = doc.data();
                    temppartners.id = doc.id;
                    temppartners.did = doc.id;

                    temppartners.branchesName = "";
                    $branches.forEach((element) => {
                        if (element.id == temppartners.branches) {
                            temppartners.branchesName = element.name;
                        }
                    });

                    temppartners.positionsName = "";
                    $positions.forEach((element) => {
                        if (element.id == temppartners.positions) {
                            temppartners.positionsName = element.name;
                        }
                    });

                    tmp.push(temppartners);
                });
                partners = tmp;
                await tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(partners).draw(false);
                }
                // if(datatable != undefined){
                //     datatable.rows('dom').invalidate().draw(false);
                // }
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
                db.collection("partners").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("partners").doc(id).update(update);
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
    <TitleBar title="Empleados" base="Inventario" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Cumpleaños de Personal Estancias</h4>
                    {#if filterName != undefined && filterValue != undefined}
                        <FilterName
                            node={profileFilter != null
                                ? profileFilter[1]
                                : filterName}
                            value={filterValue}
                        />
                    {/if}
                    {#if hasAdd}
                        <div class="row">
                            <div class="col" />

                            <div class="col-md-auto align-self-end">
                                {#if modal}
                                    <!-- <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}>Agregar Empleado</button
                                    > -->
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addpartners/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue
                                                );
                                            } else {
                                                push("/addpartners");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        /> Agregar Empleado</button
                                    >
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <table
                        id="partners-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Activo</th>
                                <th>Nombre</th>
                                <!-- <th>Apellido Paterno</th> -->
                                <!-- <th>Email de acceso</th> -->
                                <th>Fecha de Nacimiento</th>
                                <th>Sueldo</th>
                                <th>Estancia</th>
                                <th>Fecha de Ingreso</th>
                                <th>Fecha de Baja</th>
                                <!-- <th>Dias</th> -->
                                <!-- <th>Activo en Medi</th> -->
                                <!-- <th>En Estancia</th> -->

                                <!-- <th>Acciones</th> -->
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
                                        Agregar Empleado
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
                                    <PartnersEdit
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
