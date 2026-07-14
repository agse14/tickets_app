<script>
    /* global jQuery */
    import { onMount, onDestroy } from "svelte";
    import { push } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { get } from 'svelte/store';
    import { permissions, fbuser } from "../stores.js";
    // import { DateTime } from "luxon";

    export let params = {};
    let sprintId = params.sprintId;
    let sprint = null;
    let tickets = [];
    let unsubscribeSprint;
    let unsubscribeTickets;
    let loading = true;

    // Drag and drop state
    let dragTicket = null;
    let toasts = [];

    // Column definitions for Kanban board
    let columns = [
        { id: 0, title: "Asignado/Abierto", tickets: [], color: 'secondary'  },
        { id: 1, title: "En Progreso", tickets: [], color: 'info'  },
        { id: 2, title: "Resuelto", tickets: [], color: 'warning'  },
        { id: 3, title: "Cerrado", tickets: [], color: 'success'  }
    ];

    onMount(() => {
        if (!sprintId) {
            push('/sprints');
            return;
        }
        loadSprint();
        loadTickets();
    });

    onDestroy(() => {
        if (unsubscribeSprint) unsubscribeSprint();
        if (unsubscribeTickets) unsubscribeTickets();
    });

    function loadSprint() {
        unsubscribeSprint = db.collection('sprints').doc(sprintId).onSnapshot((doc) => {
            if (doc.exists) {
                sprint = { id: doc.id, ...doc.data() };
            } else {
                sprint = null;
            }
            loading = false;
        });
    }

    function loadTickets() {
        // Load tickets assigned to this sprint
        unsubscribeTickets = db.collection('tickets')
            .where('sprintId', '==', sprintId)
            .orderBy('createdDate', 'desc')
            .onSnapshot((querySnapshot) => {
                const tmp = [];
                querySnapshot.forEach((doc) => {
                    const ticket = doc.data();
                    ticket.id = doc.id;
                    // Ensure numeric fields
                    ticket.status = Number(ticket.status);
                    ticket.priority = Number(ticket.priority);
                    ticket.estimatedHours = Number(ticket.estimatedHours) || 0;
                    tmp.push(ticket);
                });
                groupTickets(tmp);
            });
    }

    function groupTickets(list) {
        // Build a fresh columns array so Svelte reactivity notices the change
        const newCols = columns.map(c => ({ id: c.id, title: c.title, tickets: [] }));
        list.forEach((t) => {
            const idx = Number(t.status) || 0;
            const col = newCols.find((c) => c.id === idx) || newCols[0];
            // ensure we don't carry transient UI-only flags across updates
            const ticketCopy = { ...t };
            delete ticketCopy._moved;
            col.tickets.push(ticketCopy);
        });
        columns = newCols;
    }

    function onDragStart(event, ticket) {
        // Only admins can initiate drag
        if (!get(permissions).admin) {
            event.preventDefault();
            return;
        }
        dragTicket = ticket;
        event.dataTransfer.setData('text/plain', ticket.id);
        event.dataTransfer.effectAllowed = "move";
    }

    function onDragOver(event) {
        event.preventDefault();
    }

    async function onDrop(event, column) {
        event.preventDefault();
        if (!dragTicket) return;
        // Only admins can change status
        if (!get(permissions).admin) return;

        const targetStatus = Number(column.id);
        const prevStatus = Number(dragTicket.status) || 0;
        if (prevStatus === targetStatus) {
            dragTicket = null;
            return;
        }

        // Optimistic UI update: remove from source column and add to destination immediately
        const srcCol = columns.find((c) => c.id === prevStatus);
        const dstCol = columns.find((c) => c.id === targetStatus) || columns[0];
        let moved = null;
        let srcIndex = -1;
        if (srcCol) {
            srcIndex = srcCol.tickets.findIndex((t) => t.id === dragTicket.id);
            if (srcIndex > -1) {
                moved = srcCol.tickets.splice(srcIndex, 1)[0];
            }
        }
        if (!moved) moved = { ...dragTicket };
        moved.status = targetStatus;
        // mark as moved for visual feedback
        moved._moved = true;
        dstCol.tickets.unshift(moved);

        // force Svelte to notice the nested array changes
        columns = columns.map(c => ({ ...c, tickets: [...c.tickets] }));

        // remove moved flag after animation duration
        setTimeout(() => {
            const idx = dstCol.tickets.findIndex(t => t.id === moved.id);
            if (idx > -1) {
                delete dstCol.tickets[idx]._moved;
                // force reactivity again
                columns = columns.map(c => ({ ...c, tickets: [...c.tickets] }));
            }
        }, 800);

        // clear drag state in UI
        dragTicket = null;

        // Persist change to Firestore, revert locally if it fails
        try {
            await db.collection('tickets').doc(moved.id).update({ status: targetStatus, lastUpdated: new Date(), lastUpdatedBy: get(fbuser).uid });
            showToast('Ticket movido correctamente', 'info');
        } catch (err) {
            console.error(err);
            // revert optimistic move
            const curIdx = dstCol.tickets.findIndex((t) => t.id === moved.id);
            if (curIdx > -1) dstCol.tickets.splice(curIdx, 1);
            if (srcCol) {
                moved.status = prevStatus;
                if (srcIndex >= 0) srcCol.tickets.splice(srcIndex, 0, moved);
                else srcCol.tickets.push(moved);
            }
            // force Svelte to notice the nested array changes after revert
            columns = columns.map(c => ({ ...c, tickets: [...c.tickets] }));
            showToast('No se pudo actualizar el estado del ticket en el servidor.', 'error');
        }
    }

    async function updateTicketStatus(ticketId, newStatus, sprintId = null) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const prevStatus = ticket.status;
        const prevSprintId = ticket.sprintId;
        
        if (prevStatus === newStatus && prevSprintId === sprintId) {
            dragTicket = null;
            return;
        }

        // Optimistic UI update
        ticket.status = newStatus;
        ticket.sprintId = sprintId;
        ticket._moved = true;
        tickets = [...tickets];

        // Clear moved flag after animation
        setTimeout(() => {
            const idx = tickets.findIndex(t => t.id === ticketId);
            if (idx > -1) {
                delete tickets[idx]._moved;
                tickets = [...tickets];
            }
        }, 800);

        dragTicket = null;

        // Persist to Firestore
        try {
            const update = {
                status: newStatus,
                sprintId: sprintId,
                lastUpdated: new Date(),
                lastUpdatedBy: get(fbuser).uid
            };
            await db.collection('tickets').doc(ticketId).update(update);
            showToast('Ticket movido correctamente', 'info');
        } catch (error) {
            console.error('Error updating ticket:', error);
            // Revert optimistic update
            ticket.status = prevStatus;
            ticket.sprintId = prevSprintId;
            delete ticket._moved;
            tickets = [...tickets];
            showToast('Error al mover el ticket', 'error');
        }
    }

    async function removeTicketFromSprint(ticketId) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const prevSprintId = ticket.sprintId;
        if (!prevSprintId) {
            dragTicket = null;
            return;
        }

        // Optimistic UI update
        ticket.sprintId = null;
        ticket._moved = true;
        tickets = [...tickets];

        // Clear moved flag after animation
        setTimeout(() => {
            const idx = tickets.findIndex(t => t.id === ticketId);
            if (idx > -1) {
                delete tickets[idx]._moved;
                tickets = [...tickets];
            }
        }, 800);

        dragTicket = null;

        // Persist to Firestore
        try {
            const update = {
                sprintId: null,
                lastUpdated: new Date(),
                lastUpdatedBy: get(fbuser).uid
            };
            await db.collection('tickets').doc(ticketId).update(update);
            showToast('Ticket removido del sprint', 'info');
        } catch (error) {
            console.error('Error removing ticket from sprint:', error);
            // Revert optimistic update
            ticket.sprintId = prevSprintId;
            delete ticket._moved;
            tickets = [...tickets];
            showToast('Error al remover el ticket del sprint', 'error');
        }
    }

    function showToast(message, type = "info", timeout = 4000) {
        const id = Date.now() + Math.random();
        toasts = [{ id, message, type }, ...toasts];
        setTimeout(() => {
            toasts = toasts.filter(t => t.id !== id);
        }, timeout);
    }

    function getPriorityClass(priority) {
        switch (priority) {
            case 0: return 'badge-light';
            case 1: return 'badge-primary';
            case 2: return 'badge-warning';
            case 3: return 'badge-danger';
            default: return 'badge-secondary';
        }
    }

    function getStatusName(status) {
        const names = {
            0: 'Backlog',
            1: 'To Do',
            2: 'In Progress',
            3: 'Done',
            4: 'Cancelado'
        };
        return names[status] || 'Desconocido';
    }

    function timeToAgo(timeStr) {
        if (!timeStr) return '';
        if (timeStr instanceof firebase.firestore.Timestamp) {
            return DateTime.fromJSDate(timeStr.toDate()).setLocale('es-mx').toRelative({ days: 1 });
        }
        return DateTime.fromISO(timeStr).setLocale('es-mx').toRelative({ days: 1 });
    }

    // helpers for card display
    function priorityLabel(p) {
        const map = { 3: 'Urgente', 2: 'Alta', 1: 'Media', 0: 'Baja' };
        return map[Number(p)] || 'Baja';
    }

    function formatDate(d) {
        if (!d) return '';
        const dt = d.toDate ? d.toDate() : new Date(d);
        return dt.toLocaleDateString();
    }

    // View modal state
    let viewTicket = null;
    function openView(ticket) {
        viewTicket = ticket;
        // show modal by toggling a classname or relying on Bootstrap modal if available
        const modal = document.getElementById('ticketViewModal');
        if (modal) jQuery(modal).modal('show');
    }
    function closeView() {
        const modal = document.getElementById('ticketViewModal');
        if (modal) jQuery(modal).modal('hide');
        viewTicket = null;
    }
</script>

<div class="page-content">
    <TitleBar title="Tablero de Sprint" base="Administración" />

    {#if loading}
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Cargando...</span>
            </div>
        </div>
    {:else if !sprint}
        <div class="alert alert-warning">
            Sprint no encontrado.
        </div>
    {:else}
        <div class="row mb-3">
            <div class="col">
                <h4>{sprint.name}</h4>
                <p class="text-muted">
                    {sprint.startDate ? DateTime.fromJSDate(sprint.startDate.toDate()).toLocal().toLocaleString(DateTime.DATE_MED) : ''} - 
                    {sprint.endDate ? DateTime.fromJSDate(sprint.endDate.toDate()).toLocal().toLocaleString(DateTime.DATE_MED) : ''}
                </p>
            </div>
            <div class="col-auto">
                <button class="btn btn-primary" on:click={() => push('/sprints')}>
                    Volver a Sprints
                </button>
            </div>
        </div>

        <div class="row">
            {#each columns as col}
                <div class="col-md-3 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-secondary text-white">
                            <h5 class="mb-0">{col.title}</h5>
                            <small>{col.tickets.length} tickets</small>
                        </div>
                        <div 
                            class="card-body kanban-column" 
                            on:dragover={onDragOver} 
                            on:drop={(e) => onDrop(e, col)}
                        >
                            {#each col.tickets as ticket}
                                <div 
                                    class="ticket-card {ticket._moved ? 'moved' : ''}" 
                                    draggable={get(permissions).admin} 
                                    on:dragstart={(e) => onDragStart(e, ticket)}
                                >
                                    <div class="card-head">
                                        <div class="card-title">{ticket.title}</div>
                                        <div class="card-badges">
                                          <button class="btn btn-sm btn-light me-1" title="Ver" on:click={()=>openView(ticket)}>
                                            <i class="bx bx-show"></i>
                                          </button>
                                          <span class="badge badge-num">#{ticket.ticketNumber || ticket.id}</span>
                                          <span class="badge badge-priority p-{ticket.priority}">{priorityLabel(ticket.priority)}</span>
                                        </div>
                                    </div>
                                    {#if ticket.description}
                                        <div class="card-body-text">{ticket.description}</div>
                                    {/if}
                                    <div class="card-meta">
                                        <small>Asignado: {ticket.assignedToName || '—'}</small>
                                        <small>{formatDate(ticket.createdDate)}</small>
                                    </div>
                                </div>
                            {/each}
                            {#if col.tickets.length === 0}
                                <div class="text-center text-muted py-4">
                                    No hay tickets
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if toasts && toasts.length}
  <div class="toast-wrap" aria-live="polite">
    {#each toasts as t}
      <div class="toast-item {t.type}">{t.message}</div>
    {/each}
  </div>
{/if}

<!-- View Modal -->
<div class="modal fade" id="ticketViewModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Detalle del Ticket</h5>
        <button type="button" class="close" aria-label="Close" on:click={closeView}><span aria-hidden="true">&times;</span></button>
      </div>
      <div class="modal-body">
        {#if viewTicket}
          <h5>{viewTicket.title}</h5>
          <p><strong>No. Ticket:</strong> {viewTicket.ticketNumber || viewTicket.id}</p>
          <p><strong>Estado:</strong> {viewTicket.status !== undefined ? (['Backlog','To Do','In Progress','Done','Cancelado'][viewTicket.status] || viewTicket.status) : ''}</p>
          <p><strong>Prioridad:</strong> {priorityLabel(viewTicket.priority)}</p>
          <p><strong>Categoría:</strong> {viewTicket.categoryName || ''}</p>
          <p><strong>Reportado por:</strong> {viewTicket.reportedByName || ''}</p>
          <p><strong>Asignado a:</strong> {viewTicket.assignedToName || ''}</p>
          <hr />
          <p>{viewTicket.description}</p>
        {/if}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-light" on:click={closeView}>Cerrar</button>
      </div>
    </div>
  </div>
</div>

<style>
    .kanban-column {
        min-height: 400px;
        max-height: 600px;
        overflow-y: auto;
    }
    
    .ticket-card {
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 8px;
        padding: 0.6rem;
        margin-bottom: 0.6rem;
        cursor: grab;
        box-shadow: 0 2px 8px rgba(15,15,15,0.03);
        transition: transform 160ms ease, box-shadow 160ms ease;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    .ticket-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(15,15,15,0.06); }

    .card-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .card-title { font-weight: 600; font-size: 0.95rem; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-badges { display: flex; gap: 0.35rem; align-items: center; }
    /* make badges uniform width and centered to avoid long labels looking huge */
    .card-badges .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.12rem 0.5rem;
        min-width: 40px;
        border-radius: 999px;
        font-size: 0.72rem;
        color: #fff;
        box-sizing: border-box;
        text-align: center;
        white-space: nowrap;
    }
    .badge-num { background: linear-gradient(90deg,#6b7280,#9ca3af); padding: 0.08rem 0.45rem; min-width: 36px; font-weight: 600; }
    .badge-priority { background: #6b7280; font-weight: 600; }
    .badge-priority.p-3 { background: #e11d48; } /* Urgente */
    .badge-priority.p-2 { background: #f97316; } /* Alta */
    .badge-priority.p-1 { background: #f59e0b; } /* Media */
    .badge-priority.p-0 { background: #10b981; } /* Baja */
    .card-body-text { color: #374151; font-size: 0.9rem; max-height: 3.2rem; overflow: hidden; text-overflow: ellipsis; }
    .card-meta { display: flex; justify-content: space-between; color: #6b7280; font-size: 0.78rem; }

    .ticket-card.moved {
        animation: move-highlight 700ms ease-out;
    }

    @keyframes move-highlight {
        0% { transform: translateY(-6px) scale(1.02); box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
        60% { transform: translateY(2px) scale(1.01); }
        100% { transform: translateY(0) scale(1); }
    }

    /* toast styles */
    .toast-wrap {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        pointer-events: none;
    }
    .toast-item {
        pointer-events: auto;
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        min-width: 200px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.12);
        transform-origin: top right;
        animation: toast-in 240ms ease-out;
    }
    .toast-item.error { background: #e74c3c; }
    .toast-item.info { background: #2d9cdb; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>