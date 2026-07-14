<script>
    /* global jQuery */
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    import { fun } from "../callable";
    import { permissions, profile, fbuser } from "../stores.js";
    import TicketsEdit from "./TicketsEdit.svelte";

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
    export let profileFilter = null;
    export let hasAdd = true;
    export let hasEdit = true;

    let tickets = [];

    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let loading = false;
    let showModal = false;
    let sprints = [];

    // Filter mode: 0 = Abiertos (default), 1 = Todos
    let filterMode = 0;

    let filterName = params.field;
    let filterValue = params.value;

    let editData = { field: filterName, value: filterValue, bid: undefined };

    // Status options for tickets
    const ticketStatus = {
        0: "Abierto",
        1: "En Progreso", 
        2: "Resuelto",
        3: "Cerrado",
        4: "Cancelado"
    };

    // Priority options for tickets
    const ticketPriority = {
        0: "Baja",
        1: "Normal",
        2: "Alta",
        3: "Crítica"
    };

    // Category options for tickets
    const ticketCategory = {
        0: "Sistemas",
        1: "Administrativo",
        2: "Recursos Humanos",
        3: "Mantenimiento",
        4: "Comercial",
        5: "Gerencia",
        6: "Operaciones",
        7: "Estancias"
    };

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
        unsubscribeProfile = profile.subscribe(async (value) => {
            if (value == undefined && !$permissions.admin) {
                console.log("no profile");
                return;
            }
            if (!$permissions.admin && !$permissions.tickets) {
                console.log("not admin", value);

                filterName = profileFilter[0];
                filterValue =
                    value != undefined ? value[profileFilter[1]] ?? "" : "";
            }
            await loadSprints(); // Ensure sprints are loaded first
            loadFirebaseData();
        });
    } else {
        loadSprints().then(() => loadFirebaseData()); // Ensure sprints are loaded first
    }

    async function loadSprints() {
        try {
            const snapshot = await db.collection("sprints").get();
            sprints = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, status: doc.data().status }));
            console.log("Sprints loaded:", sprints); // Debug log
            // Note: DataTable will be updated automatically when tickets data changes
        } catch (error) {
            console.error("Error loading sprints:", error);
        }
    }

    function loadData() {
        if (!loadDataTable) {
            return;
        }
        datatable = jQuery("#tickets-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Tickets", "25 Tickets", "50 Tickets", "Todo"],
            ],
            data: tickets,
            createdRow: function (row, data, index) {},
            columns: [
                {
                    data: "ticketNumber",
                    name: "No. Ticket",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        return html(
                            '<a href="#/ticketsedit/' +
                                id +
                                '">#' +
                                data +
                                "</a>"
                        );
                    },
                },
                {
                    data: "title",
                    name: "Título",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        if (data && data.length > 50) {
                            data = data.substring(0, 50) + "...";
                        }
                        return html(data || "");
                    },
                },
                { 
                    data: "statusName", 
                    name: "Estado", 
                    width: "auto",
                    render: function (data, type, row, meta) {
                        let statusClass = "";
                        switch(row.status) {
                            case 0: statusClass = "badge-info"; break;
                            case 1: statusClass = "badge-warning"; break;
                            case 2: statusClass = "badge-success"; break;
                            case 3: statusClass = "badge-secondary"; break;
                            case 4: statusClass = "badge-danger"; break;
                        }
                        return html(`<span class="badge ${statusClass}">${data}</span>`);
                    }
                },
                { 
                    data: "priority", 
                    name: "Prioridad", 
                    width: "auto",
                    render: function (data, type, row, meta) {
                        // For display, show badge using priorityName; for sort/filter, return numeric priority
                        if (type === 'display') {
                            let priorityClass = "";
                            switch(Number(data)) {
                                case 0: priorityClass = "badge-light"; break;
                                case 1: priorityClass = "badge-primary"; break;
                                case 2: priorityClass = "badge-warning"; break;
                                case 3: priorityClass = "badge-danger"; break;
                            }
                            const display = row.priorityName || ( ["Baja","Normal","Alta","Crítica"][Number(data)] || data );
                            return html(`<span class="badge ${priorityClass}">${display}</span>`);
                        }
                        // For sorting and other types, return the numeric priority
                        return Number(data);
                    }
                },
                {
                    data: "estimatedHours",
                    name: "Estimación (hrs)",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        // Display N/A when field is missing/null
                        if (type === 'display') {
                            if (data === undefined || data === null) return html('N/A');
                            return html(String(Number(data)));
                        }
                        // For sorting/filtering return numeric value, put N/A as -1 so it sorts last when desc
                        const n = Number(data);
                        return isNaN(n) ? -1 : n;
                    }
                },
                { data: "categoryName", name: "Categoría", width: "auto" },
                { data: "reportedByName", name: "Reportado por", width: "auto" },
                { data: "requestingAreaName", name: "Área solicitante", width: "auto" },
                {
                    data: "sprintId",
                    name: "Sprint",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        if (!data) return html("Sin asignar");
                        const sprint = sprints.find(s => s.id === data);
                        if (sprint) {
                            return html(`${sprint.name} (${sprint.status === 'active' ? 'Activo' : 'Planificado'})`);
                        }
                        return html("Sprint desconocido");
                    }
                },
                {
                    data: "createdDate",
                    name: "Fecha de creación",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        return html(
                            timeToAgo(data) +
                                "<br /><small>" +
                                timeFormated(data) +
                                "</small>"
                        );
                    },
                },
                {
                    data: "lastUpdated",
                    name: "Última actualización",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        if (!data) return "";
                        return html(
                            timeToAgo(data) +
                                "<br /><small>" +
                                timeFormated(data) +
                                "</small>"
                        );
                    },
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
                                    '<a href="#/edittickets/' +
                                    data +
                                    '" class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
                            }
                        }

                        if($permissions.admin) {
                            buttons += "<button onclick=\"deleteDoc('" +
                                data +
                                '\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button>';
                        }

                        return html(buttons);
                    },
                },
            ],
            language: {
                lengthMenu: "Ver _MENU_",
                info: "Mostrando _PAGE_ de _PAGES_ páginas",
                "search":  "Buscar:",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior",
                },
            },
            buttons: [
                {
                    extend: 'copy',
                    filename: 'Listado de Tickets'
                },
                {
                    extend: 'excel',
                    filename: 'Listado de Tickets'
                },
                {
                    extend: 'pdf',
                    filename: 'Listado de Tickets'
                }
            ],
            responsive: true,
            scrollX: true,
            fixedColumns: true,
            order: [[ 3, "desc" ], [ 8, "desc" ]] // Order by priority desc, then creation date desc
        });

        datatable
            .buttons()
            .container()
            .appendTo("#tickets-dt_wrapper .col-md-6:eq(0)");
    }

    function loadFirebaseData() {
        // Cancel any existing subscription
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = undefined;
        }
        
        let query = db.collection("tickets");
        if (filterName != undefined && filterValue != undefined) {
            console.log("filter : " + filterName + " == " + filterValue);
            query = query.where(filterName, "==", filterValue);
        }

        // Restrict to own tickets if user is not admin/support
        // Skip restriction if user has tickets permission AND there's an explicit filter (area/category)
        if (!$permissions.admin && !$permissions.support) {
            const hasExplicitFilter = filterName != undefined && filterValue != undefined;
            if (!($permissions.tickets && hasExplicitFilter)) {
                if ($fbuser && $fbuser.uid) {
                    query = query.where('reportedBy', '==', $fbuser.uid);
                } else {
                    // No user info yet - subscribe to fbuser and retry when available
                    const unsub = fbuser.subscribe((u) => {
                        if (u && u.uid) {
                            unsub();
                            loadFirebaseData();
                        }
                    });
                    return;
                }
            }
        }

        // Filter to only show open and in-progress tickets (only if filterMode is 0)
        if (filterMode === 0) {
            query = query.where('status', 'in', [0, 1]);
        }

        unsubscribe = query
            .orderBy('priority', 'desc')
            // .orderBy("createdDate", "desc")
             .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    const tempTicket = doc.data();
                    tempTicket.id = doc.id;
                    tempTicket.did = doc.id;
                    // Ensure numeric fields are numbers (Select2 / legacy data may store them as strings)
                    if (tempTicket.status !== undefined && tempTicket.status !== null) {
                        tempTicket.status = Number(tempTicket.status);
                    }
                    if (tempTicket.priority !== undefined && tempTicket.priority !== null) {
                        tempTicket.priority = Number(tempTicket.priority);
                    }
                    // Coerce estimatedHours if present
                    if (tempTicket.estimatedHours !== undefined && tempTicket.estimatedHours !== null) {
                        const eh = Number(tempTicket.estimatedHours);
                        tempTicket.estimatedHours = isNaN(eh) ? undefined : eh;
                    }
                    // Some tickets store the area field as 'area' (from TicketsEdit). Prefer that,
                    // otherwise fall back to legacy 'category'. Coerce to Number either way.
                    if (tempTicket.area !== undefined && tempTicket.area !== null) {
                        tempTicket.category = Number(tempTicket.area);
                    } else if (tempTicket.category !== undefined && tempTicket.category !== null) {
                        tempTicket.category = Number(tempTicket.category);
                    } else {
                        tempTicket.category = 0;
                    }

                    // Set status name
                    tempTicket.statusName = ticketStatus[tempTicket.status] || "Desconocido";

                    // Set priority name
                    tempTicket.priorityName = ticketPriority[tempTicket.priority] || "Normal";

                    // Set category name
                    tempTicket.categoryName = ticketCategory[tempTicket.category] || "Otros";

                    // Set requesting area name
                    let areaName = ticketCategory[tempTicket.requestingArea] || "Sin asignar";
                    if (tempTicket.requestingArea == 7 && tempTicket.branchName) {
                        areaName += ` (${tempTicket.branchName})`;
                    }
                    tempTicket.requestingAreaName = areaName;

                    // Ensure there is a visible default when no assignee
                    if (!tempTicket.assignedToName || tempTicket.assignedToName === "") {
                        tempTicket.assignedToName = "Sin asignar";
                    }

                    // Ensure reportedByName has a sensible default
                    if (!tempTicket.reportedByName || tempTicket.reportedByName === "") {
                        tempTicket.reportedByName = "Usuario desconocido";
                    }

                    tmp.push(tempTicket);
                });
                
                tickets = tmp;
                await tick();
                
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(tickets).draw(false);
                }
            });
    }

    function html(data) {
        return data;
    }

    function changeFilterMode(mode) {
        filterMode = mode;
        // Cancel previous subscription before loading new data
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = undefined;
        }
        loadFirebaseData();
    }

    function setEditId(eId) {
        editData = { field: filterName, value: filterValue, bid: eId };
        showModal = true;
        jQuery("#editModalScrollable").modal("show");
    }

    function deleteDoc(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea eliminar este ticket",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, borrarlo!",
        }).then(function (result) {
            if (result.value) {
                db.collection("tickets").doc(id).delete();
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        update["lastUpdated"] = new Date();
        update["lastUpdatedBy"] = $fbuser.uid;
        db.collection("tickets").doc(id).update(update);
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
                .toLocaleString(DateTime.DATETIME_MED);
        }
        return DateTime.fromISO(timeStr)
            .setLocale("es-mx")
            .toLocaleString(DateTime.DATETIME_MED);
    }

    function runFunction(fid, params) {
        if (typeof fun[fid] === "function") {
            loading = true;
            fun[fid](params)
                .then((result) => {
                    var sanitizedMessage = result.data.text;
                    loading = false;
                })
                .catch((error) => {
                    loading = false;
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
    <TitleBar title="Tickets Abiertos" base="Administración" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración de Tickets Abiertos</h4>
                    
                    <!-- Filter buttons -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="btn-group" role="group">
                                <button 
                                    type="button" 
                                    class="btn btn-outline-primary {filterMode === 0 ? 'active' : ''}"
                                    on:click={() => changeFilterMode(0)}
                                >
                                    Abiertos
                                </button>
                                <button 
                                    type="button" 
                                    class="btn btn-outline-primary {filterMode === 1 ? 'active' : ''}"
                                    on:click={() => changeFilterMode(1)}
                                >
                                    Todos
                                </button>
                            </div>
                        </div>
                    </div>
                    
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
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}>Crear Ticket</button
                                    >
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addtickets/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue
                                                );
                                            } else {
                                                push("/addtickets");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        /> Crear Ticket</button
                                    >
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <table
                        id="tickets-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>No. Ticket</th>
                                <th>Título</th>
                                <th>Estado</th>
                                <th>Prioridad</th>
                                <th>Estimación (hrs)</th>
                                <th>Categoría</th>
                                <th>Reportado por</th>
                                <th>Área solicitante</th>
                                <th>Sprint</th>
                                <th>Fecha de creación</th>
                                <th>Última actualización</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            
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
                        <div class="modal-dialog modal-dialog-scrollable modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5
                                        class="modal-title mt-0"
                                        id="editModalScrollableTitle"
                                    >
                                        Gestionar Ticket
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
                                    <TicketsEdit
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