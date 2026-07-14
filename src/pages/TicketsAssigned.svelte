<script>
    /* global jQuery */
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    import { permissions, profile, fbuser } from "../stores.js";

    let tickets = [];
    let datatable;
    let unsubscribe;
    let loading = false;
    let sprints = [];

    // Status / priority / category maps (same as TicketsList)
    const ticketStatus = {0: "Abierto",1: "En Progreso",2: "Resuelto",3: "Cerrado",4: "Cancelado"};
    const ticketPriority = {0: "Baja",1: "Normal",2: "Alta",3: "Crítica"};
    const ticketCategory = {0: "Sistemas",1: "Administrativo",2: "Recursos Humanos",3: "Mantenimiento",4: "Comercial",5: "Gerencia",6: "Operaciones",7: "Estancias"};

    // Ensure sprints loaded and then data
    onMount(() => {
        loadSprints().then(() => loadFirebaseData());
    });

    onDestroy(() => {
        if (datatable) {
            datatable.clear();
            datatable.destroy();
            datatable = undefined;
        }
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = undefined;
        }
    });

    async function loadSprints() {
        try {
            const snapshot = await db.collection("sprints").get();
            sprints = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, status: doc.data().status }));
        } catch (e) {
            console.error(e);
        }
    }

    function loadData() {
        datatable = jQuery("#tickets-assigned-dt").DataTable({
            lengthMenu: [[10,25,50,-1],["10 Tickets","25 Tickets","50 Tickets","Todo"]],
            data: tickets,
            columns: [
                { data: 'ticketNumber', render: function (data, type, row, meta) { var id = ""; if (row != undefined) id = row.id; return html('<a href="#/ticketsedit/' + id + '">#' + data + '</a>'); } },
                { data: 'title' },
                { data: 'statusName', render: (d,row) => html('<span class="badge badge-info">'+d+'</span>') },
                { data: 'priorityName', render: (d,row) => html('<span class="badge badge-secondary">'+d+'</span>') },
                { data: 'reportedByName' },
                { data: 'requestingAreaName' },
                { data: 'createdDate', render: (d) => html(timeToAgo(d)+"<br/><small>"+timeFormated(d)+"</small>") },
                { data: 'did', render: function (data, type, row, meta) { let buttons = '<a href="#/ticketsedit/'+data+'" class="btn btn-light"><i class="bx bx-edit-alt"></i></a>'; if (row.status != 2) buttons += ' <button onclick="markResolved(\''+data+'\')" class="btn btn-success"><i class="bx bx-check"></i></button>'; return html(buttons); } }
            ],
            responsive: true,
            scrollX: true
        });
    }

    function loadFirebaseData() {
        if (unsubscribe) { unsubscribe(); unsubscribe = undefined; }

        // Need current user email
        if ($fbuser && $fbuser.email) {
            // Filter by assignedToEmail matching logged-in user's email
            let query = db.collection('tickets').where('assignedToEmail','==',$fbuser.email);

            unsubscribe = query.orderBy('priority','desc').onSnapshot(async (querySnapshot) => {
                const tmp = [];
                querySnapshot.forEach(doc => {
                    const t = doc.data();
                    t.id = doc.id; t.did = doc.id;
                    t.status = t.status !== undefined && t.status !== null ? Number(t.status) : 0;
                    t.priority = t.priority !== undefined && t.priority !== null ? Number(t.priority) : 1;
                    t.estimatedHours = t.estimatedHours !== undefined ? Number(t.estimatedHours) : undefined;
                    t.category = t.area !== undefined ? Number(t.area) : (t.category !== undefined ? Number(t.category) : 0);
                    t.statusName = ticketStatus[t.status] || 'Desconocido';
                    t.priorityName = ticketPriority[t.priority] || 'Normal';
                    t.categoryName = ticketCategory[t.category] || 'Otros';
                    let areaName = ticketCategory[t.requestingArea] || 'Sin asignar';
                    if (t.requestingArea == 7 && t.branchName) areaName += ` (${t.branchName})`;
                    t.requestingAreaName = areaName;
                    if (!t.assignedToName) t.assignedToName = 'Sin asignar';
                    if (!t.reportedByName) t.reportedByName = 'Usuario desconocido';
                    tmp.push(t);
                });
                tickets = tmp;
                await tick();
                if (!datatable) loadData(); else { datatable.clear(); datatable.rows.add(tickets).draw(false); }
            });
        } else {
            const unsub = fbuser.subscribe(u => {
                if (u && u.email) {
                    unsub();
                    loadFirebaseData();
                }
            });
        }
    }

    function html(d) { return d; }

    function timeToAgo(t) {
        if (!t) return '';
        if (t instanceof firebase.firestore.Timestamp) return DateTime.fromJSDate(t.toDate()).setLocale('es-mx').toRelative({ days: 1 });
        return DateTime.fromISO(t).setLocale('es-mx').toRelative({ days: 1 });
    }

    function timeFormated(t) {
        if (!t) return '';
        if (t instanceof firebase.firestore.Timestamp) return DateTime.fromJSDate(t.toDate()).setLocale('es-mx').toLocaleString(DateTime.DATETIME_MED);
        return DateTime.fromISO(t).setLocale('es-mx').toLocaleString(DateTime.DATETIME_MED);
    }

    function markResolved(id) {
        Swal.fire({
            title: "¿Marcar como resuelto?",
            text: "Esto cambiará el estado del ticket a Resuelto",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, resolver",
            cancelButtonText: "Cancelar"
        }).then(function (result) {
            if (result.value) {
                db.collection("tickets").doc(id).update({
                    status: 2,
                    lastUpdated: new Date(),
                    lastUpdatedBy: $fbuser.uid
                });
            }
        });
    }

    window.markResolved = markResolved;
</script>

<div class="page-content">
    <TitleBar title="Mis Tickets (Asignados)" base="Tickets" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Tickets asignados a mí</h4>
                    <table id="tickets-assigned-dt" class="table table-striped table-bordered dt-responsive nowrap" style="width:100%">
                        <thead>
                            <tr>
                                <th>No. Ticket</th>
                                <th>Título</th>
                                <th>Estado</th>
                                <th>Prioridad</th>
                                <th>Reportado por</th>
                                <th>Área solicitante</th>
                                <th>Fecha de creación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
