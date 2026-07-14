<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile } from "../stores.js";
    import SupervisionEdit from "./SupervisionEdit.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte"

    import { branches } from "../controls/branches";
    import SupervisionSteps from "../controls/SupervisionSteps.svelte";
    import StepOptions from "../controls/StepOptions.svelte";

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

    export let bid;
    console.log("bid", bid);
    export let params = {};
    export let loadDataTable = true;
    export let modal = true;
    //array [0 = doc field, 1=profile field]
    export let profileFilter = null;
    export let hasAdd = true;
    export let hasEdit = true;

    let supervision = [];
    let start = DateTime.local().startOf("month").toISODate();
    let end = DateTime.local().endOf("month").toISODate();
    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let loading = false;
    let showModal = false;

    let filterName = params.field;
    let filterValue = params.value;

    let editData = { field: filterName, value: filterValue, bid: undefined };

    $: start, end, bid, loadFirebaseData();

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
            if (!$permissions.admin && !$permissions.supervision) {
                console.log("not admin", value);

                filterName = profileFilter[0];
                filterValue =
                    value != undefined ? (value[profileFilter[1]] ?? "") : "";
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
        datatable = jQuery("#supervision-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Inspección", "25 Inspección", "50 Inspección", "Todo"],
            ],
            data: supervision,
            createdRow: function (row, data, index) {
                const stepel = jQuery("#step" + data.id, row).get(0);
                if (stepel != null) {
                    supervision[index].stepControl = new SupervisionSteps({
                        target: stepel,
                        props: {
                            value: data["step"],
                            data: data,
                            inlist: true,
                        },
                    });
                }
            },
            columns: [
                {
                    data: "added",
                    name: "Fecha",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        
                        // Convertimos el valor a una fecha utilizando Luxon
                        var date = DateTime.fromJSDate(data.toDate()).setLocale("es-mx");
                        
                        // Formateo con fecha y hora
                        var formattedDate = date.toLocaleString({
                            ...DateTime.DATE_MED_WITH_WEEKDAY, // Incluye la fecha con día de la semana
                            hour: "2-digit",                  // Formato de hora en 2 dígitos
                            minute: "2-digit",                // Formato de minuto en 2 dígitos
                        });

                        // Devolver el valor según el tipo (sort o display)
                        return type == "sort"
                            ? date.toISODate()
                            : html(
                                '<a href="#/editsupervision/' +
                                    id +
                                    '">' +
                                    formattedDate +
                                    "</a>",
                            );
                    },
                },
                {
                    data: "step",
                    name: "Resultados",
                    render: function (data, type, row, meta) {
                        return html('<div id="step' + row.id + '"></div>');
                    },
                },
                {
                    data: "branchesName",
                    name: "Estas generando reporte de la estancia",
                    width: "auto",
                },
                {
                    data: "did",
                    name: "Acciones",
                    render: function (data, type, row, meta) {
                        let buttons = "";
                        if (hasEdit) {
                            if (modal) {
                                buttons +=
                                    '<button type="button" class="btn btn-light waves-effect" onclick="setEditId(\'' +
                                    data +
                                    '\');"><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>';
                            } else {
                                buttons +=
                                    '<a href="#/editsupervision/' +
                                    data +
                                    '" class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
                            }
                        }

                        return html(
                            buttons +
                                "<button onclick=\"deleteDoc('" +
                                data +
                                '\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button>',
                        );
                    },
                },
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
            buttons: ["copy", "excel", "pdf"],
            responsive: true,
            scrollX: true,
        });

        datatable
            .buttons()
            .container()
            .appendTo("#supervision-dt_wrapper .col-md-6:eq(0)");
    }
    function loadFirebaseData() {
        let newstart = DateTime.fromISO(start).toJSDate();
        let newend = DateTime.fromISO(end).endOf("day").toJSDate();

        let query = db.collection("supervision")
        .where("added", ">=", newstart)
        .where("added", "<=", newend);
        if(bid != undefined && bid != ""){
            console.log(bid)
            query = query.where("branches","==",bid);
        }

        unsubscribe = query
            .orderBy("added", "desc")
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    // console.log(`${doc.id} => ${doc.data()}`);
                    const tempsupervision = doc.data();
                    tempsupervision.id = doc.id;
                    tempsupervision.did = doc.id;

                    tempsupervision.branchesName = "";
                    $branches.forEach((elbranches) => {
                        if (elbranches.id == tempsupervision.branches) {
                            tempsupervision.branchesName = elbranches.name;
                        }
                    });

                    tmp.push(tempsupervision);
                });
                supervision = tmp;
                await tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(supervision).draw(false);
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
                db.collection("supervision").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("supervision").doc(id).update(update);
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
    <TitleBar title="Inspección" base="Inventario" />
    <div class="">
        <p>
            <BranchesSearchList bind:value={bid} inlist={!hasEdit} />
        </p>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración Inspección</h4>
                    <!-- {filterName} {filterValue} -->
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
                            <div class="col"></div>

                            <div class="row input-group col-6">
                                <div class="col-12 no-print">
                                  <label>Fechas</label>
                                </div>
                                <div class="col-6">
                                  <div class="form-group mb-0 no-print">
                                    Desde<br />
                                    <input
                                      type="date"
                                      class="form-control"
                                      id="start"
                                      name="start"
                                      bind:value={start}
                                    />
                                  </div>
                                </div>
                                <div class="col-6 no-print">
                                  Hasta<br />
                                  <input
                                    type="date"
                                    class="form-control"
                                    name="end"
                                    id="end"
                                    bind:value={end}
                                  />
                                </div>                                
                            </div>

                            <!-- <div class="col-md-auto align-self-end">
                                {#if modal}
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}
                                        >Agregar Inspecciones de Supervisión</button
                                    >
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addsupervision/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue,
                                                );
                                            } else {
                                                push("/addsupervision");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        ></i> Agregar Inspecciones de Supervisión</button
                                    >
                                {/if}
                            </div> -->
                        </div>
                    {/if}
                    <!-- <SupervisionHead data={supervision} /> -->

                    <table
                        id="supervision-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Resultados</th>
                                <th>Estas generando reporte de la estancia</th>

                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody> </tbody>
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
                                        Agregar Inspecciones de Supervisión
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
                                                "#editModalScrollable",
                                            ).modal("hide");
                                            showModal = false;
                                        }}
                                        aria-label="Close"
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                {#if showModal}
                                    <SupervisionEdit
                                        params={editData}
                                        onBack={() => {
                                            editData = {
                                                field: filterName,
                                                value: filterValue,
                                                bid: undefined,
                                            };
                                            jQuery(
                                                "#editModalScrollable",
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