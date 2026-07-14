<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    import { fun } from "../callable";
    import { permissions, profile, fbuser } from "../stores.js";
    import TicketsEdit from "./TicketsEdit.svelte";

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";

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
    let loading = false;
    let showModal = false;

    // This view is dedicated to ticketCategory = Sistemas (0)
    const forcedCategory = 0; // Sistemas

    let filterName = 'category';
    let filterValue = forcedCategory;

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
        5: "Gerencia"
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

    loadFirebaseData();

    function loadData() {
        if (!loadDataTable) {
            return;
        }
        datatable = jQuery("#tickets-dt-sistemas").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Tickets", "25 Tickets", "50 Tickets", "Todo"],
            ],
            data: tickets,
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
                { data: "assignedToName", name: "Asignado a", width: "auto" },
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

                        // Show authorize button to support or admin users for tickets that are still Open (status 0)
                        try {
                            if (($permissions.support || $permissions.admin) && row.status === 0) {
                                buttons += "<button onclick=\"authorizeTicket('" + data + "')\" class=\"btn btn-success waves-effect waves-light mr-1\">Autorizar</button>";
                            }
                        } catch(e) {
                            // ignore if permissions not available in this scope
                        }

                        if($permissions.admin) {
                            buttons += "<button onclick=\"deleteDoc('" +
                                data +
                                "')\" class=\"btn btn-danger waves-effect waves-light\"><i class=\"bx bx-x font-size-16 align-middle\"></i></button>";
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
                    filename: 'Listado de Tickets Sistemas'
                },
                {
                    extend: 'excel',
                    filename: 'Listado de Tickets Sistemas'
                },
                {
                    extend: 'pdf',
                    filename: 'Listado de Tickets Sistemas'
                }
            ],
            responsive: true,
            scrollX: true,
            fixedColumns: true,
            order: [[ 3, "desc" ], [ 7, "desc" ]]
        });

        datatable
            .buttons()
            .container()
            .appendTo("#tickets-dt-sistemas_wrapper .col-md-6:eq(0)");
    }

    function loadFirebaseData() {
        let query = db.collection("tickets");

        // Only include tickets that are still Open (status = 0)
    query = query.where('status', '==', 0);

        // If the current user is not admin/support, restrict to tickets reported by them
        if (!$permissions.admin && !$permissions.support) {
            if ($fbuser && $fbuser.uid) {
                query = query.where('reportedBy', '==', $fbuser.uid);
            } else {
                const unsub = fbuser.subscribe((u) => {
                    if (u && u.uid) {
                        unsub();
                        loadFirebaseData();
                    }
                });
                return;
            }
        }

        unsubscribe = query
            .orderBy('priority', 'desc')
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    const tempTicket = doc.data();
                    tempTicket.id = doc.id;
                    tempTicket.did = doc.id;

                    if (tempTicket.status !== undefined && tempTicket.status !== null) {
                        tempTicket.status = Number(tempTicket.status);
                    }
                    if (tempTicket.priority !== undefined && tempTicket.priority !== null) {
                        tempTicket.priority = Number(tempTicket.priority);
                    }
                    if (tempTicket.area !== undefined && tempTicket.area !== null) {
                        tempTicket.category = Number(tempTicket.area);
                    } else if (tempTicket.category !== undefined && tempTicket.category !== null) {
                        tempTicket.category = Number(tempTicket.category);
                    } else {
                        tempTicket.category = 0;
                    }

                    // Coerce issueType to Number if present (handles legacy/string values)
                    if (tempTicket.issueType !== undefined && tempTicket.issueType !== null) {
                        tempTicket.issueType = Number(tempTicket.issueType);
                    }

                    // Coerce estimatedHours if present
                    if (tempTicket.estimatedHours !== undefined && tempTicket.estimatedHours !== null) {
                        const eh = Number(tempTicket.estimatedHours);
                        tempTicket.estimatedHours = isNaN(eh) ? undefined : eh;
                    }

                    // Filter to only show Sistemas category (0) tickets
                    if (tempTicket.category !== forcedCategory) {
                        return; // skip tickets not in Sistemas category
                    }

                    tempTicket.statusName = ticketStatus[tempTicket.status] || "Desconocido";
                    tempTicket.priorityName = ticketPriority[tempTicket.priority] || "Normal";
                    tempTicket.categoryName = ticketCategory[tempTicket.category] || "Otros";

                    if (!tempTicket.assignedToName || tempTicket.assignedToName === "") {
                        tempTicket.assignedToName = "Sin asignar";
                    }

                    if (!tempTicket.reportedByName || tempTicket.reportedByName === "") {
                        tempTicket.reportedByName = "Usuario desconocido";
                    }

                    // Enforce numeric issueType equals forcedIssueType for safety
                    // Removed filter for issueType to show all tickets in Sistemas category

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

    async function authorizeTicket(id) {
        // Only support or admin users can authorize
        if (!($permissions.support || $permissions.admin)) {
            Swal.fire({
                title: 'No autorizado',
                text: 'No tiene permisos para autorizar este ticket.',
                icon: 'warning'
            });
            return;
        }

        const ticketIndex = tickets.findIndex(t => t.did === id || t.id === id);
        if (ticketIndex === -1) return;

        const ticket = tickets[ticketIndex];
        if (ticket.status !== 0) {
            Swal.fire({
                title: 'Acción no válida',
                text: 'Solo se pueden autorizar tickets en estado Abierto.',
                icon: 'info'
            });
            return;
        }

        const confirm = await Swal.fire({
            title: 'Autorizar ticket',
            text: '¿Desea autorizar este ticket para que pueda ser trabajado?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, autorizar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.value) return;

        // Optimistic UI: set status locally to 1 (En Progreso)
        const oldStatus = ticket.status;
        ticket.status = 1;
        ticket.statusName = ticketStatus[1];
        tickets = [...tickets];

        // Prepare update
        const update = {
            status: 1,
            lastUpdated: new Date(),
            lastUpdatedBy: $fbuser ? $fbuser.uid : null
        };

        // Write to Firestore and add a system comment
        try {
            await db.collection('tickets').doc(id).update(update);

            // Add system comment indicating authorization
            const comment = {
                ticketId: id,
                comment: 'Ticket autorizado por ' + ($fbuser ? ($fbuser.displayName || $fbuser.email) : 'soporte'),
                createdDate: new Date(),
                createdBy: $fbuser ? $fbuser.uid : null,
                createdByName: $fbuser ? ($fbuser.displayName || $fbuser.email) : 'Soporte',
                isInternal: true,
                isSystemGenerated: true
            };
            await db.collection('ticket_comments').add(comment);

            Swal.fire({
                title: 'Ticket autorizado',
                text: 'El ticket ha sido autorizado y puesto en estado En Progreso.',
                icon: 'success'
            });
        } catch (err) {
            // Revert optimistic change
            ticket.status = oldStatus;
            ticket.statusName = ticketStatus[oldStatus] || 'Desconocido';
            tickets = [...tickets];

            Swal.fire({
                title: 'Error',
                text: 'No se pudo autorizar el ticket: ' + (err.message || err),
                icon: 'error'
            });
        }
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
    window.authorizeTicket = authorizeTicket;

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
    <TitleBar title="Tickets Sistemas" base="Sistemas" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Tickets de Sistemas</h4>

                    <table
                        id="tickets-dt-sistemas"
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
                                <th>Asignado a</th>
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
