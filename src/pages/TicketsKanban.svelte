<script>
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import { fbuser, permissions } from "../stores.js";
  import { get } from "svelte/store";

  let columns = [
    { id: 0, title: "Abierto", tickets: [] },
    { id: 1, title: "En Progreso", tickets: [] },
    { id: 2, title: "Resuelto", tickets: [] },
    { id: 3, title: "Cerrado", tickets: [] },
    { id: 4, title: "Cancelado", tickets: [] }
  ];

  let loading = true;
  let unsubscribe;

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

  onMount(() => {
    const query = db.collection("tickets")
      .where('area', '==', 0)
      .where('sprintId', '==', null)
      .orderBy("createdDate", "desc");
    unsubscribe = query.onSnapshot((snap) => {
      const tmp = [];
      snap.forEach((doc) => {
        const d = doc.data();
        d.id = doc.id;
        // coerce numeric
        d.status = Number(d.status);
        d.priority = Number(d.priority);
        tmp.push(d);
      });
      groupTickets(tmp);
      loading = false;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  });

  // Drag and drop handlers
  let dragTicket = null;

  // simple toast notifications
  let toasts = [];
  function showToast(message, type = "info", timeout = 4000) {
    const id = Date.now() + Math.random();
    toasts = [{ id, message, type }, ...toasts];
    // auto remove
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, timeout);
  }

  function onDragStart(event, ticket) {
    // Only admins can initiate drag
    if (!get(permissions).admin) {
      event.preventDefault();
      return;
    }
    dragTicket = ticket;
    event.dataTransfer.setData("text/plain", ticket.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function allowDrop(event) {
    event.preventDefault();
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
      await db.collection("tickets").doc(moved.id).update({ status: targetStatus, lastUpdated: new Date(), lastUpdatedBy: get(fbuser).uid });
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
      showToast("No se pudo actualizar el estado del ticket en el servidor.", "error");
    }
  }
</script>

<style>
  .kanban {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  .kanban-column {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    width: 20%;
    min-height: 200px;
    padding: 0.5rem;
  }
  .kanban-column h5 {
    margin: 0 0 0.5rem 0;
  }
  .ticket-card {
    background: #f8f9fb;
    border-radius: 4px;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: grab;
  }
  .ticket-card.dragging {
    opacity: 0.5;
  }
  .ticket-card.moved {
    animation: move-highlight 700ms ease-out;
  }

  /* improved card visuals */
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

  /* responsive: columns stack on small screens */
  @media (max-width: 900px) {
    .kanban { flex-direction: column; }
    .kanban-column { width: 100%; }
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

<div class="page-content">
  <TitleBar title="Kanban Tickets - Sistemas (Sin Sprint)" base="Administración" />
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <h4 class="card-title">Tablero Kanban - Sistemas (Sin Sprint Asignado)</h4>
          {#if loading}
            <p>Cargando...</p>
          {:else}
            <div class="kanban">
              {#each columns as col}
                <div class="kanban-column" on:dragover={allowDrop} on:drop={(e)=>onDrop(e,col)}>
                  <h5>{col.title} ({col.tickets.length})</h5>
                    {#each col.tickets as t}
                    <div class="ticket-card" draggable={get(permissions).admin} on:dragstart={(e)=>onDragStart(e,t)}>
                      <div class="card-head">
                        <div class="card-title">{t.title}</div>
                        <div class="card-badges">
                          <button class="btn btn-sm btn-light me-1" title="Ver" on:click={()=>openView(t)}>
                            <i class="bx bx-show"></i>
                          </button>
                          <span class="badge badge-num">#{t.ticketNumber || t.id}</span>
                          <span class="badge badge-priority p-{t.priority}">{priorityLabel(t.priority)}</span>
                        </div>
                      </div>
                      {#if t.description}
                        <div class="card-body-text">{t.description}</div>
                      {/if}
                      <div class="card-meta">
                        <small>Asignado: {t.assignedToName || '—'}</small>
                        <small>Tiempo: {t.estimatedHours + 'hr' || '0h'}</small>
                        <small>{formatDate(t.createdDate)}</small>
                      </div>
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
          {/if}
        </div>

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
                    <p><strong>Estado:</strong> {viewTicket.status !== undefined ? (['Abierto','En Progreso','Resuelto','Cerrado','Cancelado'][viewTicket.status] || viewTicket.status) : ''}</p>
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
      </div>
    </div>
  </div>
</div>

{#if toasts && toasts.length}
  <div class="toast-wrap" aria-live="polite">
    {#each toasts as t}
      <div class="toast-item {t.type}">{t.message}</div>
    {/each}
  </div>
{/if}
