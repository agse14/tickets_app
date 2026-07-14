<script>
  import TitleBar from "../TitleBar.svelte";
  import { onDestroy } from "svelte";
  import { branches } from "../controls/branches.js";
  import { patients } from "../controls/patients.js";
  import { workers } from "../controls/workers";
  import { fbuser, permissions } from "../stores.js";
  import IncidentTypeListSelect from "../controls/IncidentTypeListSelect.svelte";
  import BranchesSearchList from "../controls/BranchesSearchList.svelte";

  export let bid;

  let incidents = [];
  let unsubscribe;
  let loading = false;
  let showModalText = false;
  let fullText = "";
  let statusFilter = null;
  let typeFilter = null;
  let searchFolio = "";
  let sortBy = "added";

  let start = DateTime.local().startOf("month").toISODate();
  let end = DateTime.local().endOf("month").toISODate();

  $: start, end, bid, loadFirebaseData();

  $: filtered = applyFilters(incidents);
  $: kpiTotal = filtered.length;
  $: kpiNuevos = filtered.filter(i => i.status === 0).length;
  $: kpiRevision = filtered.filter(i => i.status === 1).length;
  $: kpiCompletados = filtered.filter(i => i.status === 2).length;
  $: kpiUrgentes = filtered.filter(i => i.status !== 2 && isUrgent(i.added)).length;

  const typeOptions = ["Inconformidad de Familiar", "Caso de salud delicado", "Reporte de seguridad", "Accidente", "Problemas con familiar", "Problemas con personal"];
  const statusLabels = ["Nuevo", "Atendiendo", "Cerrado", "Esperando CEO", "Esperando Cliente", "Esperando Proveedor"];
  const statusClasses = ["badge-danger", "badge-warning", "badge-success", "badge-info", "badge-secondary", "badge-secondary"];

  function isUrgent(ts) {
    if (!ts) return false;
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return (Date.now() - d.getTime()) > 7 * 24 * 60 * 60 * 1000;
  }

  function daysSince(ts) {
    if (!ts) return null;
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  }

  function getUrgencyLabel(ts) {
    const d = daysSince(ts);
    if (d === null) return "";
    if (d === 0) return { text: "Hoy", class: "badge-success" };
    if (d <= 1) return { text: "Ayer", class: "badge-warning" };
    if (d <= 3) return { text: `Hace ${d} días`, class: "badge-warning" };
    if (d <= 7) return { text: `Hace ${d} días`, class: "badge-orange" };
    return { text: `Hace ${d} días`, class: "badge-danger" };
  }

  function applyFilters(data) {
    let result = [...data];
    if (statusFilter !== null) result = result.filter(i => i.status === statusFilter);
    if (typeFilter !== null) result = result.filter(i => Number(i.type) === typeFilter);
    if (searchFolio) result = result.filter(i => String(i.folio || "").includes(searchFolio));
    if (sortBy === "added") result.sort((a, b) => (b.added?.seconds || 0) - (a.added?.seconds || 0));
    if (sortBy === "folio") result.sort((a, b) => (b.folio || 0) - (a.folio || 0));
    if (sortBy === "urgency") result.sort((a, b) => (daysSince(b.added) || 0) - (daysSince(a.added) || 0));
    return result;
  }

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  function openModal(text) {
    fullText = text;
    showModalText = true;
  }

  function loadFirebaseData() {
    unsubscribe?.();
    const newstart = DateTime.fromISO(start).toJSDate();
    const newend = DateTime.fromISO(end).endOf("day").toJSDate();

    let query = db.collection("incident")
      .where("added", ">=", newstart)
      .where("added", "<=", newend);

    if (bid) query = query.where("branches", "==", bid);

    loading = true;
    unsubscribe = query.orderBy("added", "desc").onSnapshot((querySnapshot) => {
      const tmp = [];
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        const t = Number(item.type);
        const d = Number(item.details);
        if ((t !== 0 && t !== 5) || d < 8) return;
        item.id = doc.id;
        item.branchesName = $branches.find(b => b.id === item.branches)?.name || "";
        item.patientsName = $patients.find(p => p.id === item.patients)?.name || item.patientNames || "";
        item.workersName = $workers.find(w => w.id === item.workers)?.name || item.workerNames || "";
        tmp.push(item);
      });
      incidents = tmp;
      loading = false;
    });
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
      preConfirm: (log) => db.collection("incident").doc(id).update({
        logs: firebase.firestore.FieldValue.arrayUnion({
          message: log,
          date: firebase.firestore.Timestamp.now(),
          user: $fbuser.uid,
          name: $fbuser.displayName ?? "",
        }),
      }),
    }).then(r => { if (r.value) Swal.fire("Guardado!", "El seguimiento ha sido guardado.", "success"); });
  }

  function handleCloseDate(id) {
    Swal.fire({
      title: "¿Está seguro?",
      text: "Desea marcar este reporte como 'Cerrado'",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Sí, cerrar!",
    }).then(r => {
      if (r.value) db.collection("incident").doc(id).update({
        status: 2,
        closedBy: $fbuser.uid,
        closedName: $fbuser.displayName ?? "",
        closedDate: firebase.firestore.Timestamp.now(),
      });
    });
  }

  function handleAttendedDate(id) {
    Swal.fire({
      title: "¿Está seguro?",
      text: "Desea marcar este reporte como 'Atendido'",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Sí, atender!",
    }).then(r => {
      if (r.value) db.collection("incident").doc(id).update({
        status: 1,
        attendedBy: $fbuser.uid,
        attendedName: $fbuser.displayName ?? "",
        attendedDate: firebase.firestore.Timestamp.now(),
      });
    });
  }

  function deleteDoc(id) {
    Swal.fire({
      title: "¿Está seguro?",
      text: "Desea eliminar este registro",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Sí, borrarlo!",
    }).then(r => { if (r.value) db.collection("incident").doc(id).delete(); });
  }

  function timeToAgo(timeStr) {
    if (!timeStr) return "";
    const d = timeStr.seconds ? new Date(timeStr.seconds * 1000) : new Date(timeStr);
    return DateTime.fromJSDate(d).setLocale("es-mx").toRelative({ days: 1 });
  }

  function timeFormated(timeStr) {
    if (!timeStr) return "";
    const d = timeStr.seconds ? new Date(timeStr.seconds * 1000) : new Date(timeStr);
    return DateTime.fromJSDate(d).setLocale("es-mx").toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
  }
</script>

<style>
  .kpi-card { border-radius: 12px; border: 1px solid #e8e5e0; transition: box-shadow 0.2s, transform 0.15s; }
  .kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
  .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .incident-card { border-radius: 12px; border: 1px solid #e8e5e0; background: #fff; transition: box-shadow 0.2s, transform 0.15s; overflow: hidden; }
  .incident-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
  .incident-card.new { border-left: 4px solid #dc3545; }
  .incident-card.review { border-left: 4px solid #e8a317; }
  .incident-card.done { border-left: 4px solid #28a745; }
  .folio-badge { font-size: 11px; font-weight: 700; background: #f5f3f0; color: #6b6b6b; padding: 2px 10px; border-radius: 100px; }
  .subject-text { font-size: 14px; color: #2d2d2d; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; cursor: pointer; }
  .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #9c9c9c; font-weight: 600; }
  .action-btn { width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; cursor: pointer; transition: all 0.15s; background: #fafaf8; color: #6b6b6b; }
  .action-btn:hover { background: #f0eeec; }
  .action-btn.close-btn { border-color: #c6d4b0; color: #6b7a3a; }
  .action-btn.close-btn:hover { background: #f4f7ee; }
  .action-btn.attend-btn { border-color: #f0d4a0; color: #b87d10; }
  .action-btn.attend-btn:hover { background: #fef7e8; }
  .action-btn.edit-btn { border-color: #d4d0c8; }
  .action-btn.edit-btn:hover { background: #f0eeec; }
  .action-btn.del-btn { border-color: #f0c4c4; color: #c62828; }
  .action-btn.del-btn:hover { background: #fef2f2; }
  .action-btn.log-btn { border-color: #b8d4e8; color: #2d7d9a; }
  .action-btn.log-btn:hover { background: #e8f4fa; }
  .badge-orange { background: #c96b2e; color: #fff; }
  .filter-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: #9c9c9c; margin-bottom: 3px; }
</style>

<div class="page-content">
  <TitleBar title="Incidencias RH" base="Tickets" />

  {#if !$permissions.admin && !$permissions.hr}
    <div class="alert alert-warning">Acceso denegado. No tiene permisos para ver este módulo.</div>
  {:else}
    <!-- Create buttons -->
    <div class="row mb-3">
      <div class="col-12">
        <a href="#/addincident/5" class="btn btn-secondary waves-effect waves-light mr-2">
          <i class="bx bx-plus font-size-16 align-middle mr-1"></i> Reportar Incidente Personal
        </a>
        <a href="#/addincident/0" class="btn btn-primary waves-effect waves-light">
          <i class="bx bx-plus font-size-16 align-middle mr-1"></i> Reportar Inconformidad
        </a>
      </div>
    </div>
    <!-- KPI row -->
    <div class="row mb-3">
      <div class="col-xl-3 col-md-6 col-6 mb-2 mb-xl-0">
        <div class="kpi-card card h-100">
          <div class="card-body d-flex align-items-center py-3 px-3">
            <div class="kpi-icon" style="background: rgba(108,117,125,0.1);"><i class="bx bx-layout" style="color: #6c757d;"></i></div>
            <div class="ml-3"><div class="meta-label">Total</div><div class="font-weight-bold" style="font-size: 22px;">{kpiTotal}</div></div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6 col-6 mb-2 mb-xl-0">
        <div class="kpi-card card h-100">
          <div class="card-body d-flex align-items-center py-3 px-3">
            <div class="kpi-icon" style="background: rgba(220,53,69,0.1);"><i class="bx bx-time" style="color: #dc3545;"></i></div>
            <div class="ml-3"><div class="meta-label">Urgentes</div><div class="font-weight-bold" style="font-size: 22px; color: #dc3545;">{kpiUrgentes}</div></div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6 col-6 mb-2 mb-xl-0">
        <div class="kpi-card card h-100">
          <div class="card-body d-flex align-items-center py-3 px-3">
            <div class="kpi-icon" style="background: rgba(220,53,69,0.08);"><i class="bx bx-message-square-error" style="color: #dc3545;"></i></div>
            <div class="ml-3"><div class="meta-label">Nuevos</div><div class="font-weight-bold" style="font-size: 22px; color: #dc3545;">{kpiNuevos}</div></div>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6 col-6">
        <div class="kpi-card card h-100">
          <div class="card-body d-flex align-items-center py-3 px-3">
            <div class="kpi-icon" style="background: rgba(40,167,69,0.1);"><i class="bx bx-check-circle" style="color: #28a745;"></i></div>
            <div class="ml-3"><div class="meta-label">Completados</div><div class="font-weight-bold" style="font-size: 22px; color: #28a745;">{kpiCompletados}</div></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card" style="border-radius: 12px; border: 1px solid #e8e5e0; margin-bottom: 16px;">
      <div class="card-body py-3 px-3">
        <div class="row align-items-end g-2">
          <div class="col-md-2 mb-2 mb-md-0">
            <div class="filter-label"><i class="bx bx-building mr-1"></i> Estancia</div>
            <BranchesSearchList bind:value={bid} />
          </div>
          <div class="col-md-2 mb-2 mb-md-0">
            <div class="filter-label"><i class="bx bx-calendar mr-1"></i> Desde</div>
            <input type="date" class="form-control form-control-sm" bind:value={start} />
          </div>
          <div class="col-md-2 mb-2 mb-md-0">
            <div class="filter-label"><i class="bx bx-calendar mr-1"></i> Hasta</div>
            <input type="date" class="form-control form-control-sm" bind:value={end} />
          </div>
          <div class="col-md-2 mb-2 mb-md-0">
            <div class="filter-label"><i class="bx bx-search mr-1"></i> Folio</div>
            <input type="text" class="form-control form-control-sm" placeholder="Buscar folio..." bind:value={searchFolio} />
          </div>
          <div class="col-md-2 mb-2 mb-md-0">
            <div class="filter-label"><i class="bx bx-sort mr-1"></i> Ordenar</div>
            <select class="form-control form-control-sm" bind:value={sortBy}>
              <option value="added">Más recientes</option>
              <option value="urgency">Más urgentes</option>
              <option value="folio">Folio</option>
            </select>
          </div>
          <div class="col-md-2 d-flex justify-content-end">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn {statusFilter === null ? 'btn-dark' : 'btn-outline-dark'}" on:click={() => statusFilter = null}>Todos</button>
              <button class="btn {statusFilter === 0 ? 'btn-danger' : 'btn-outline-danger'}" on:click={() => statusFilter = 0}>Nuevo</button>
              <button class="btn {statusFilter === 1 ? 'btn-warning' : 'btn-outline-warning'}" on:click={() => statusFilter = 1}>Revisión</button>
              <button class="btn {statusFilter === 2 ? 'btn-success' : 'btn-outline-success'}" on:click={() => statusFilter = 2}>Hecho</button>
            </div>
          </div>
        </div>
        <div class="row mt-2">
          <div class="col-12 d-flex flex-wrap align-items-center" style="gap: 6px;">
            <span class="filter-label mr-1"><i class="bx bx-filter mr-1"></i> Tipo:</span>
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn {typeFilter === null ? 'btn-secondary' : 'btn-outline-secondary'}" on:click={() => typeFilter = null}>Todos</button>
              <button class="btn {typeFilter === 0 ? 'btn-primary' : 'btn-outline-primary'}" on:click={() => typeFilter = 0}>Inconformidad</button>
              <button class="btn {typeFilter === 5 ? 'btn-secondary' : 'btn-outline-secondary'}" on:click={() => typeFilter = 5}>Problemas con personal</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    {#if loading}
      <div class="text-center py-5"><div class="spinner-border" style="color: #9c9d36;"></div><p class="mt-2 text-muted">Cargando...</p></div>
    {:else if filtered.length === 0}
      <div class="text-center py-5">
        <i class="bx bx-check-circle" style="font-size: 56px; color: #d4d0c8;"></i>
        <h5 class="mt-2" style="color: #6b6b6b;">Sin incidencias</h5>
        <p style="color: #9c9c9c; font-size: 14px;">No hay registros con los filtros actuales</p>
      </div>
    {:else}
      <!-- Cards -->
      <div class="row">
        {#each filtered as row (row.id)}
          <div class="col-xl-4 col-lg-6 mb-3">
            <div class="incident-card {row.status === 0 ? 'new' : row.status === 1 ? 'review' : 'done'}">
              <div class="px-3 pt-3 pb-2 d-flex justify-content-between align-items-center" style="border-bottom: 1px solid #f5f3f0;">
                <div class="d-flex align-items-center" style="gap: 6px;">
                  <span class="badge badge-{row.type === 5 ? 'secondary' : 'primary'}" style="font-size: 10px; padding: 3px 8px;">
                    {typeOptions[row.type] || 'Desconocido'}
                  </span>
                  {#if row.folio}
                    <span class="folio-badge"><i class="bx bx-hash" style="font-size: 10px;"></i> {row.folio}</span>
                  {/if}
                </div>
                <div>
                  {#if row.status == 0}
                    <span class="badge badge-danger badge-pill" style="font-size: 10px; padding: 3px 8px;">Nuevo</span>
                  {:else if row.status == 1}
                    <span class="badge badge-warning badge-pill" style="font-size: 10px; padding: 3px 8px;">Revisión</span>
                  {:else if row.status == 2}
                    <span class="badge badge-success badge-pill" style="font-size: 10px; padding: 3px 8px;">Completado</span>
                  {/if}
                </div>
              </div>
              <div class="px-3 py-2">
                {#if row.status !== 2}
                  {@const urg = getUrgencyLabel(row.added)}
                  <div class="mb-1">
                    <span class="badge badge-pill {urg.class}" style="font-size: 10px; padding: 2px 8px;">
                      <i class="bx bx-time"></i> {urg.text}
                    </span>
                  </div>
                {:else if row.closedDate}
                  <div class="mb-1">
                    <small class="text-muted" style="font-size: 10px;"><i class="bx bx-check-circle text-success"></i> Cerrado {timeToAgo(row.closedDate)}</small>
                  </div>
                {/if}
                <div class="subject-text mb-2" on:click={() => openModal(row.subject)}>
                  {row.subject || 'Sin descripción'}
                </div>
                <div class="d-flex flex-wrap" style="gap: 8px;">
                  {#if row.branchesName}
                    <div>
                      <div class="meta-label">Estancia</div>
                      <div style="font-size: 12px; font-weight: 600;">{row.branchesName}</div>
                    </div>
                  {/if}
                  {#if row.patientsName}
                    <div>
                      <div class="meta-label">Paciente</div>
                      <div style="font-size: 12px; font-weight: 600;">{row.patientsName}</div>
                    </div>
                  {/if}
                  {#if row.workersName}
                    <div>
                      <div class="meta-label">Trabajador</div>
                      <div style="font-size: 12px; font-weight: 600;">{row.workersName}</div>
                    </div>
                  {/if}
                  {#if row.position}
                    <div>
                      <div class="meta-label">Puesto</div>
                      <div style="font-size: 12px; font-weight: 600;">{row.position}</div>
                    </div>
                  {/if}
                </div>
                {#if row.logs?.length > 0}
                  <div class="mt-2 pt-2" style="border-top: 1px solid #f5f3f0;">
                    <div class="meta-label mb-1"><i class="bx bx-comment-detail"></i> Seguimiento ({row.logs.length})</div>
                    <div style="font-size: 11px; color: #6b6b6b; max-height: 36px; overflow: hidden;">
                      {row.logs[row.logs.length - 1].message}
                    </div>
                  </div>
                {/if}
              </div>
              <div class="px-3 py-2 d-flex justify-content-between align-items-center" style="background: #fafaf8; border-top: 1px solid #f0eeec;">
                <div class="d-flex" style="gap: 4px;">
                  {#if row.status !== 2}
                    <button class="action-btn close-btn" title="Cerrar" on:click={() => handleCloseDate(row.id)}><i class="bx bx-check"></i></button>
                    {#if row.status !== 1}
                      <button class="action-btn attend-btn" title="Atender" on:click={() => handleAttendedDate(row.id)}><i class="bx bx-play"></i></button>
                    {/if}
                  {/if}
                  <button class="action-btn log-btn" title="Seguimiento" on:click={() => addIncidentlog(row.id)}><i class="bx bx-plus"></i></button>
                  <a href="#/editincident/{row.id}" class="action-btn edit-btn" title="Editar"><i class="bx bx-edit-alt"></i></a>
                  {#if $permissions.admin}
                    <button class="action-btn del-btn" title="Eliminar" on:click={() => deleteDoc(row.id)}><i class="bx bx-trash"></i></button>
                  {/if}
                </div>
                <div style="font-size: 11px; color: #9c9c9c;">
                  {timeFormated(row.added)}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Text modal -->
    {#if showModalText}
      <div class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalle completo</h5>
              <button type="button" class="close" on:click={() => showModalText = false}>&times;</button>
            </div>
            <div class="modal-body"><p>{fullText}</p></div>
            <div class="modal-footer">
              <button class="btn btn-secondary" on:click={() => showModalText = false}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    {/if}
  {/if}
</div>
