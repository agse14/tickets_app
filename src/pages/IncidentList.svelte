<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    import { routes } from "../menu";
    import { fun } from "../callable";
    import IncidentEdit from "./IncidentEdit.svelte";

    import { branches } from "../controls/branches.js";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { patients } from "../controls/patients.js";
    import PatientsSearchList from "../controls/PatientsSearchList.svelte";
    import IncidentStatusListSelect from "../controls/IncidentStatusListSelect.svelte";
    import IncidentTypeListSelect from "../controls/IncidentTypeListSelect.svelte";
    import SupervisionHead from "../controls/SupervisionHead.svelte";

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { flip } from "svelte/animate";
    import { fbuser, permissions, profile } from "../stores.js";
    import { addPatientlog } from "../controls/patientlog";
    import { workers } from "../controls/workers";

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
    export let params = {};
    export let loadDataTable = true;
    export let modal = true;

    let incident = [];
    let viewMoreId = undefined;

    let datatable;
    let unsubscribe;
    let loading = false;
    let showModal = false;
    let showModalText = false;

    let filterName = params.field;
    let filterValue = params.value;
    let start = DateTime.local().startOf("month").toISODate();
    let end = DateTime.local().endOf("month").toISODate();
    let fullText = "";
    let statusFilter = null; // null = todos

    const setStatusFilter = (val) => {
        statusFilter = val;
    };

    let editData = { field: filterName, value: filterValue, bid: undefined };
    $: start, end, bid, loadFirebaseData();
    const hasAdd =
        Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addincident") === 0;
        }).length > 0;
    const hasEdit =
        Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editincident/") === 0;
        }).length > 0;
    // let hasEdit =
    //     false;

    onMount(() => {});
    onDestroy(() => {
        if (datatable != undefined && datatable != null) {
            datatable.destroy();
        }
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
        }
        // unsubscribeProfile();
    });
    function openModal(text) {
        fullText = text;
        showModalText = true;
    }
    // const unsubscribeProfile = profile.subscribe(value => {
    //     if(value == undefined && !$permissions.admin){
    //         console.log("no profile");
    //         return;
    //     }
	// 	if(!$permissions.admin && !$permissions.accounting && !$permissions.view_payments){
    //         console.log("not admin",value);

    //         filterName = 'branch';
    //         filterValue = value?.branches ?? '';
    //     }else{
    //         hasEdit = true;
    //         try{
    //             let vObject = window.localStorage.getItem("filterValue");
    //             if(vObject != undefined && vObject != null){
    //                 filterValue = vObject;
    //             }

    //         }catch(e){
    //             console.log(e);
    //         }
    //     }
    //     loadFirebaseData();
	// });
    function loadData() {
        if (!loadDataTable) {
            return;
        }
        datatable = jQuery("#incident-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Reportes", "25 Reportes", "50 Reportes", "Todo"],
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
            //minHeight: 500,
            minHeigh: "500px",
            scrollX: true,
        });

        datatable
            .buttons()
            .container()
            .appendTo("#incident-dt_wrapper .col-md-6:eq(0)");
            // datatable.rows("dom").invalidate().draw(false);
    }
    function loadFirebaseData() {
        unsubscribe?.();
        // datatable?.destroy();
        // datatable = undefined;
        // let query = db.collection("incident");
        let newstart = DateTime.fromISO(start).toJSDate();
        let newend = DateTime.fromISO(end).endOf("day").toJSDate();

        let query = db
            .collection("incident")
            .where("added", ">=", newstart)
            .where("added", "<=", newend);
        if (bid != undefined && bid != "") {
            console.log(bid);
            query = query.where("branches", "==", bid);
        }

        unsubscribe = query
            .orderBy("added", "desc")
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    // console.log(`${doc.id} => ${doc.data()}`);
                    const tempincident = doc.data();
                    tempincident.id = doc.id;
                    $branches.forEach((element) => {
                        if (element.id == tempincident.branches) {
                            tempincident.branchesName = element.name;
                        }
                    });
                    $patients.forEach((element) => {
                        if (element.id == tempincident.patients) {
                            tempincident.patientsName = element.name;
                        }
                    });
                    $workers.forEach((element) => {
                        if (element.id == tempincident.workers) {
                            tempincident.workersName = element.name;
                        }
                    });

                    tmp.push(tempincident);
                });
                incident = tmp;
                await tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                }
                // if (datatable != undefined) {
                //     datatable.rows("dom").invalidate().draw(false);
                // }
            });
            console.log(incident);
    }

    function setEditId(eId) {
        editData = { field: filterName, value: filterValue, bid: eId };
        console.log("setEditId", editData);
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
                db.collection("incident").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("incident").doc(id).update(update);
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

    function addIncidentlog(id) {
        Swal.fire({
            title: "Agregar Seguimiento",
            input: "text",
            inputPlaceholder: "Escriba el seguimiento",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Guardar",
            showLoaderOnConfirm: true,
            preConfirm: (log) => {
                return db
                    .collection("incident")
                    .doc(id)
                    .update({
                        logs: firebase.firestore.FieldValue.arrayUnion({
                            message: log,
                            date: firebase.firestore.Timestamp.now(),
                            user: $fbuser.uid,
                            name: $fbuser.displayName ?? "",
                        }),
                    });
            },
        }).then((result) => {
            if (result.value) {
                Swal.fire("Guardado!", "El seguimiento ha sido guardado.", "success");
            }
        });
    }

    // Función para manejar la actualización de la fecha de cierre y el estado
    // function handleCloseDate(rowId) {
    //     const closeDate = prompt("Ingrese la fecha de cierre (Formato: YYYY-MM-DD):");

    //     if (closeDate) {
    //         const parsedDate = DateTime.fromISO(closeDate);

    //         if (parsedDate.isValid) {
    //             // Actualiza la fecha de cierre y el estado en Firestore
    //             db.collection("incident").doc(rowId).update({
    //                 closeDate: parsedDate.toISODate(),
    //                 status: 2, // Cambiar a tu estado deseado
    //             })
    //             .then(() => {
    //                 toast.success("Fecha de cierre actualizada correctamente.");
    //             })
    //             .catch((error) => {
    //                 toast.error("Error al actualizar la fecha de cierre: " + error.message);
    //             });
    //         } else {
    //             toast.error("Fecha inválida, por favor use el formato correcto.");
    //         }
    //     } else {
    //         toast.error("Fecha no proporcionada.");
    //     }
    // }
    function handleCloseDate(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea marcar este reporte como 'Cerrado'",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, aprobar!",
        }).then(function (result) {
            if (result.value) {
                db.collection("incident")
                    .doc(id)
                    .update({
                        status: 2, // Cambiar estado a "Por Aprobar"
                        closedBy: $fbuser.uid,
                        closedName: $fbuser.displayName ?? "",
                        closedDate: firebase.firestore.Timestamp.now(),
                    });
            }
        });
    }
    function handleAttendedDate(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea marcar este reporte como 'Cerrado'",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, aprobar!",
        }).then(function (result) {
            if (result.value) {
                db.collection("incident")
                    .doc(id)
                    .update({
                        status: 1, // Cambiar estado a "Por Aprobar"
                        attendedBy: $fbuser.uid,
                        attendedName: $fbuser.displayName ?? "",
                        attendedDate: firebase.firestore.Timestamp.now(),
                    });
            }
        });
    }

    
</script>

<div class="page-content">
    <TitleBar title="Reportes" base="Inventario" />
    <div class="">
        <p>
            <BranchesSearchList bind:value={bid} inlist={!hasEdit} />
        </p>
    </div>
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <SupervisionHead data={incident} />
                    <h4 class="card-title">Administración Reportes</h4>
                    {#if filterName != undefined && filterValue != undefined}
                        <FilterName node={filterName} value={filterValue} />
                    {/if}
                    {#if hasAdd}
                        <div class="row">
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
                            <div class="col"></div>

                            <!-- <div class="col-md-auto align-self-end">
                                {#if modal}
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}>Agregar Reporte Estancia</button
                                    >
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addincident/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue,
                                                );
                                            } else {
                                                push("/addincident");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        ></i> Agregar Reporte Estancia</button
                                    >
                                {/if}
                            </div> -->
                        </div>
                    {/if}
                    <div>
                        <br>
                    </div>

                    <!-- Botones de filtro -->
                    <div class="btn-group mb-3" role="group">
                        <button
                        class="btn {statusFilter === null ? 'btn-primary' : 'btn-outline-primary'}"
                        on:click={() => setStatusFilter(null)}
                        >
                        Todos
                        </button>
                        <button
                        class="btn {statusFilter === 0 ? 'btn-danger' : 'btn-outline-danger'}"
                        on:click={() => setStatusFilter(0)}
                        >
                        Nuevo
                        </button>
                        <button
                        class="btn {statusFilter === 1 ? 'btn-warning' : 'btn-outline-warning'}"
                        on:click={() => setStatusFilter(1)}
                        >
                        En Revisión
                        </button>
                        <button
                        class="btn {statusFilter === 2 ? 'btn-success' : 'btn-outline-success'}"
                        on:click={() => setStatusFilter(2)}
                        >
                        Completado
                        </button>
                    </div>
                    
                    <!-- Tabla de incidentes -->
                    <table
                        id="incident-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Estatus</th>
                                <th>Tipo de Reporte</th>
                                <th>Estancia</th>
                                <th>Paciente</th>
                                <th>Trabajador</th>
                                {#if $permissions.admin || $permissions.operations}
                                    <th>Detalle</th>
                                {/if}
                                <th>Fecha</th>
                                <th>Seguimiento</th>
                                <th>Fecha de cerrado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody style="min-height: 500px">
                            {#each incident as row (row.id)}
                                {#if (row.branches == bid || !bid) && (statusFilter === null || row.status === statusFilter)}
                                <!-- {#if row.branches == bid || bid == undefined || bid == ""} -->
                                <tr
                                    in:receive={{ key: row.id }}
                                    out:send={{ key: row.id }}
                                >
                                    <td
                                        > {#if row.status == 0}
                                        <span class="badge badge-danger">Nuevo</span>
                                    {:else if row.status == 1}
                                        <span class="badge badge-warning">En Revisión</span>
                                    {:else if row.status == 2}
                                        <span class="badge badge-success">Completado</span>
                                    {:else}
                                        <span class="badge badge-danger">Desconocido</span>
                                    {/if}
                                        </td
                                    >
                                    <td
                                        ><IncidentTypeListSelect
                                            value={row.type}
                                            inlist={true}
                                        /></td
                                    >
                                    <td><h5>{row.branchesName}</h5></td>
                                    <td><h5>{row.patientsName ?? row.patientNames}</h5></td>
                                    <td><h5>{row.workersName ?? row.workerNames}</h5></td>
                                    {#if $permissions.admin || $permissions.operations}
                                        <td>
                                            {#if row.subject?.length > 20}
                                            {row.subject.slice(0, 20)}... 
                                            <button class="btn btn-link p-0" on:click={() => openModal(row.subject)}>Ver más</button>
                                            {:else}
                                            {row.subject ?? ""}
                                            {/if}
                                        </td>
                                    {/if}
                                    <td>
                                        {timeFormated(row.added)}
                                        <br />
                                        {timeToAgo(row.added)}
                                    </td>
                                    <td>
                                        {#if row.logs != undefined && row.logs.length > 0}
                                            {#if viewMoreId == row.id}
                                            {#each row.logs as log, idx}
                                                <div>
                                                    <span style="font-weight: bold;">{idx +1}- {log.message}</span>
                                                    <br />
                                                    <span style="font-size:smaller">{timeFormated(log.date)}</span>
                                                </div>
                                            {/each}
                                            {:else}
                                                <button
                                                    on:click={() => {
                                                        viewMoreId = row.id;
                                                    }}
                                                    class="btn"
                                                    style="color:#0caadc; text-decoration: underline; font-size:smaller"
                                                >
                                                    <i
                                                        class="bx bx-plus font-size-16 align-middle"
                                                    ></i> Ver seguimiento
                                                </button>
                                            {/if}
                                        {:else}
                                            <span>No hay seguimiento</span>
                                        {/if}

                                            <button
                                                on:click={() => {
                                                    addIncidentlog(row.id);
                                                }}
                                                class="btn-info btn" style="padding: 0px 5px; margin-left: 5px">
                                                <i
                                                    class="bx bx-plus font-size-16 align-middle"
                                                ></i> 
                                            </button>
                                    </td>
                                    <td>
                                        {#if row.closedDate}
                                            {timeFormated(row.closedDate)}
                                            <br />
                                            {timeToAgo(row.closedDate)}
                                        {:else}
                                            <span>No definida</span>
                                        {/if}
                                    </td>
                                    <td>
                                        
                                        {#if row.status != 2 && ($permissions.admin || $permissions.operations)}
                                        <button
                                            on:click={() => {
                                                handleCloseDate(row.id);
                                            }}
                                            class="btn btn-info waves-effect waves-light"
                                        >
                                            <i
                                                class="bx bx-calendar font-size-16 align-middle"
                                            ></i> Cerrar
                                        </button>
                                        {#if hasEdit}
                                            {#if modal}
                                                <button
                                                    type="button"
                                                    class="btn btn-light waves-effect"
                                                    on:click={() => {
                                                        setEditId(row.id);
                                                    }}
                                                    ><i
                                                        class="bx bx-edit-alt font-size-16 align-middle"
                                                    ></i></button
                                                >
                                            {:else}
                                                <a
                                                    href="/editincident/{row.id}"
                                                    use:link
                                                    class="btn btn-light waves-effect"
                                                    ><i
                                                        class="bx bx-edit-alt font-size-16 align-middle"
                                                    ></i></a
                                                >
                                            {/if}
                                        {/if}
                                        <button
                                            on:click={() => {
                                                deleteDoc(row.id);
                                            }}
                                            class="btn btn-danger waves-effect waves-light"
                                            ><i
                                                class="bx bx-x font-size-16 align-middle"
                                                disabled={loading}
                                            ></i></button
                                        >
                                        {/if}
                                        {#if (row.status != 1 && row.status != 2) && ($permissions.admin || $permissions.admin_branch)}
                                        <button
                                            on:click={() => {
                                                handleAttendedDate(row.id);
                                            }}
                                            class="btn btn-warning waves-effect waves-light"
                                        >
                                            <i
                                                class="bx bx-calendar font-size-16 align-middle"
                                            ></i> Atendido
                                        </button>
                                        {/if}
                                        
                                    </td>
                                </tr>
                                {/if}
                            {/each}
                        </tbody>
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
                                        Agregar Reporte Estancia
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
                                    <IncidentEdit
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
                    <!-- Modal -->
                    {#if showModalText}
                    <div class="modal fade show d-block" tabindex="-1">
                        <div class="modal-dialog">
                            <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Texto Completo</h5>
                                <button type="button" class="close" on:click={() => showModalText = false}>&times;</button>
                            </div>
                            <div class="modal-body">
                                <p>{fullText}</p>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-secondary" on:click={() => showModalText = false}>Cerrar</button>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-backdrop fade show"></div>
                    {/if}


                </div>
            </div>
        </div>
        <!-- end col -->
    </div>
    <!-- end row -->
</div>
