<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile } from "../stores.js";
    import JobsEdit from "./JobsEdit.svelte";
    import { fbuser } from "../stores.js";
    import { branches } from "../controls/branches.js";
    import JobsHead from "../controls/JobsHead.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { positions } from "../controls/positions.js";
    import PositionsSearchList from "../controls/PositionsSearchList.svelte";
    import { workers } from "../controls/workers.js";
    import WorkersSearchList from "../controls/WorkersSearchList.svelte";

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

    let workabsences = [];

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
            if (!$permissions.admin && !$permissions.workabsences) {
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
        console.log($permissions);
        datatable = jQuery("#workabsences-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Vacantes", "25 Vacantes", "50 Vacantes", "Todo"],
            ],
            data: workabsences,
            createdRow: function (row, data, index) {},
            columns: [
                {
                    data: "status",
                    name: "Estatus",
                    render: function (data, type, row, meta) {
                        if (data == undefined) {
                            return "No definido";
                        }
                        switch (data) {
                            case 0:
                                return '<span class="badge badge-success">Activa</span>';
                            case 1:
                                return '<span class="badge badge-info">Cubierta</span>';
                            case 2:
                                return '<span class="badge badge-danger">Cancelada</span>';
                            case 3:
                                return '<span class="badge badge-warning">Por Aprobar</span>';
                            case 4:
                                return '<span class="badge badge-primary">Por Cubrir</span>';
                            case 5:
                                return '<span class="badge badge-success">Aprobada</span>';
                            default:
                                return "" + data;
                        }
                    },
                },
                { data: "branchesName", name: "Sucursal" },
                { data: "positionsName", name: "Puesto" },
                {
                    data: "shift",
                    name: "Turno",
                    render: function (data, type, row) {
                        return data ? data : '-';  // Muestra '-' si shift está vacío
                    }
                },
                {
                    data: "role",
                    name: "Rol",
                    render: function (data, type, row) {
                        return data ? data : 'N/A';  // Muestra 'N/A' si role está vacío
                    }
                },
                {
                    data: "addedDate",
                    render: function (data, type, row, meta) {
                        if (data == undefined) {
                            return "-";
                        }

                        // Convertir 'row.added' y 'data' a objetos DateTime de Luxon
                        const addedDate = DateTime.fromJSDate(data.toDate ? data.toDate() : new Date(data));
                        let today = DateTime.local();
                        today = today.plus({days: 1});

                        let days = 0;
                        if (row.added != undefined) {
                            const creationDate = DateTime.fromJSDate(row.added.toDate());
                            // Calcular la diferencia en días entre la fecha actual y la fecha de creación
                            days = Math.floor(today.diff(creationDate, "days").days);
                        }

                        // Si 'row.endedDate' está vacío, mostrar los días transcurridos
                        let result = addedDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
                        if (row.status != 1 && row.status != 2) {
                            result += "<br /><small>" + days + " días transcurridos</small>";
                        }

                        return result;
                    },
                },
                {
                    data: "endedDate",
                    name: "Cubierta",
                    render: function (data, type, row, meta) {
                        if (data == undefined) {
                            return "-";
                        }
                        let days = 0;
                        if (row.added != undefined) {
                            days = data
                                .diff(DateTime.fromJSDate(row.added.toDate()), "days")
                                .days.toFixed(0);
                        }
                        return (
                            data.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY) +
                            "<br /><small>Total " +
                            days +
                            " días</small>"
                        );
                    },
                },
                {
                    data: "did",
                    name: "Acciones",
                    render: function (data, type, row, meta) {
                        let buttons = "";

                        if (row.status == 0) { // Activa to status 3
                            buttons +=
                                '<button type="button" class="btn btn-warning waves-effect" onclick="setApprove(\'' +
                                data +
                                '\');"><i class="bx bx-check font-size-16 align-middle"></i> Por Aprobar</button>';
                        } else if (row.status == 3) { // Por Aprobar to status 5
                            buttons +=
                                '<button type="button" class="btn btn-primary waves-effect" onclick="setApproved(\'' +
                                data +
                                '\');"><i class="bx bx-check font-size-16 align-middle"></i> Aprobada</button>';
                        } else if (row.status == 5) { // Aprobada to status 4
                            if ($permissions.hr && $permissions.admin) {
                                buttons +=
                                    '<button type="button" class="btn btn-success waves-effect" onclick="setCover(\'' +
                                    data +
                                    '\');"><i class="bx bx-check font-size-16 align-middle"></i> Por Cubrir</button>';
                            }
                        } else if (row.status == 4) { // Por Cubrir to status 1
                            if ($permissions.hr && $permissions.admin) {
                                buttons +=
                                    '<button type="button" class="btn btn-success waves-effect" onclick="setAccepted(\'' +
                                    data +
                                    '\');"><i class="bx bx-check font-size-16 align-middle"></i> Cubierta</button>';
                            }
                        }
                        // Agregar botón de cancelar solo si el estatus no es 1 ni 2
                        if (row.status !== 1 && row.status !== 2) {
                            buttons +=
                                '<button type="button" class="btn btn-danger waves-effect" onclick="setCancel(\'' +
                                data +
                                '\');"><i class="bx bx-x font-size-16 align-middle"></i> Cancelar</button>';
                        }
                        //add button to delete registry
                        if ($permissions.hr && $permissions.admin) {
                            buttons +=
                                '<button type="button" class="btn btn-danger waves-effect" onclick="deleteDoc(\'' +
                                data +
                                '\');"><i class="bx bx-trash font-size-16 align-middle"></i> Eliminar</button>';
                        } 
                        return html(buttons);
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
            .appendTo("#workabsences-dt_wrapper .col-md-6:eq(0)");
    }
    console.log($permissions);
    function loadFirebaseData() {
        let query = db.collection("jobs");
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
                    const tempworkabsences = doc.data();
                    tempworkabsences.id = doc.id;
                    tempworkabsences.did = doc.id;

                    tempworkabsences.branchesName = "";
                    $branches.forEach((element) => {
                        if (element.id == tempworkabsences.branches) {
                            tempworkabsences.branchesName = element.name;
                        }
                    });

                    tempworkabsences.positionsName = "";
                    $positions.forEach((element) => {
                        if (element.id == tempworkabsences.positions) {
                            tempworkabsences.positionsName = element.name;
                        }

                        if (tempworkabsences.added != undefined) {
                            tempworkabsences.addedDate = DateTime.fromJSDate(
                                tempworkabsences.added.toDate(),
                            ).setLocale("es-mx");
                        }
                        if (tempworkabsences.ended != undefined) {
                            tempworkabsences.endedDate = DateTime.fromJSDate(
                                tempworkabsences.ended.toDate(),
                            ).setLocale("es-mx");
                        }
                    });

                    // 	tempworkabsences.workersName = "";
                    // 	$workers.forEach(element => {
                    //     if(element.id == tempworkabsences.workers){
                    //       tempworkabsences.workersName = element.name;
                    //     }
                    //   });

                    tmp.push(tempworkabsences);
                });
                workabsences = tmp;
                await tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(workabsences).draw(false);
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
    /**
     * Función para marcar una vacante como "Por Aprobar".
     * Cambia el estado de la vacante de "Activa" (0) a "Por Aprobar" (3).
     * @param {string} id - El ID de la vacante.
     */
     function setApprove(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea marcar esta vacante como 'Por Aprobar'",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, aprobar!",
        }).then(function (result) {
            if (result.value) {
                db.collection("jobs")
                    .doc(id)
                    .update({
                        status: 3, // Cambiar estado a "Por Aprobar"
                        approvedBy: $fbuser.uid,
                        approvedName: $fbuser.displayName ?? "",
                        approvedDate: firebase.firestore.Timestamp.now(),
                    });
            }
        });
    }

    function setApproved(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea marcar esta vacante como 'Aprobada'",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, aprobar!",
        }).then(function (result) {
            if (result.value) {
                db.collection("jobs")
                    .doc(id)
                    .update({
                        status: 5, // Cambiar estado a "Aprobada"
                        approvedBy: $fbuser.uid,
                        approvedName: $fbuser.displayName ?? "",
                        approvedDate: firebase.firestore.Timestamp.now(),
                    });
            }
        });
    }

    function setCover(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea marcar esta vacante como 'Por Cubrir'",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí!",
        }).then(function (result) {
            if (result.value) {
                db.collection("jobs")
                    .doc(id)
                    .update({
                        status: 4, // Cambiar estado a "Por Cubrir"
                        coveredBy: $fbuser.uid,
                        coveredName: $fbuser.displayName ?? "",
                        coveredDate: firebase.firestore.Timestamp.now(),
                    });
            }
        });
    }

    function setAccepted(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea marcar esta vacante como 'Cubierta'",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, cubierta!",
        }).then(function (result) {
            if (result.value) {
                db.collection("jobs")
                    .doc(id)
                    .update({
                        status: 1, // Cambiar estado a "Cubierta"
                        ended: firebase.firestore.Timestamp.now(),
                        endedBy: $fbuser.uid,
                        endedName: $fbuser.displayName ?? "",
                    });
            }
        });
    }

    /**
     * Función para marcar una vacante como "Cancelada".
     * Cambia el estado de la vacante de "Aprobada" (5) a "Cancelada" (2).
     * @param {string} id - El ID de la vacante.
     */
    function setCancel(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea cancelar esta vacante",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, cancelar!",
        }).then(function (result) {
            if (result.value) {
                db.collection("jobs")
                    .doc(id)
                    .update({
                        status: 2, // Cambiar estado a "Cancelada"
                        cancelBy: $fbuser.uid,
                        cancelName: $fbuser.displayName ?? "",
                    });
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
            confirmButtonText: "Si, borrarlo!",
        }).then(function (result) {
            if (result.value) {
                db.collection("jobs").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("jobs").doc(id).update(update);
    }
    window.setEditId = setEditId;
    window.setAccepted = setAccepted;
    window.setCancel = setCancel;
    window.deleteDoc = deleteDoc;
    window.asyncChange = asyncChange;

    // Agregar las nuevas funciones al objeto window
    window.setApprove = setApprove; // Para manejar el estado "Por Aprobar"
    window.setCover = setCover; // Para manejar el estado "Por Cubrir"
    window.setApproved = setApproved; // Para manejar el estado "Aprobada"

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
    <TitleBar title="Vacantes" base="Inventario" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración Vacantes</h4>
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

                            <div class="col-md-auto align-self-end">
                                {#if modal}
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}>Agregar Vacante</button
                                    >
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addjobs/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue,
                                                );
                                            } else {
                                                push("/addjobs");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        ></i> Agregar Vacante</button
                                    >
                                {/if}
                            </div>
                        </div>
                    {/if}
                    <JobsHead data={workabsences} />
                    <table
                        id="workabsences-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Estatus</th>
                                <th>Sucursal</th>
                                <th>Puesto</th>
                                <th>Turno</th>
                                <th>Rol</th>
                                <th>Reportada</th>
                                <th>Cubierta</th>
                                <!-- <th>Usuario</th> -->
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
                                        Agregar Vacante
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
                                    <JobsEdit
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
