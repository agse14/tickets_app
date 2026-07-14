<script>
  import { onMount, onDestroy, tick } from 'svelte';
  import TitleBar from '../TitleBar.svelte';
  import { permissions, fbuser } from '../stores.js';
  import ListSelect from '../controls/ListSelect.svelte';

  let tickets = [];
  let datatable;
  let unsubscribe;
  let loading = false;
  let dataTableInitialized = false;

  const statusOptions = ["Todos","Abierto","En Progreso","Resuelto","Cerrado","Cancelado"];
  const areaOptions = ["Todas","Sistemas","Administrativo","Recursos Humanos","Mantenimiento","Comercial","Gerencia"];
  const issueTypes = ["Soporte técnico","Requerimiento nuevo","Bug/Error"];

  let filterStatus = 0; // 0 = Todos, 1.. = status index
  let filterArea = 0; // 0 = Todas, 1.. map to category
  let filterIssueType = 0;
  let filterStartDate = null; // ISO date string yyyy-mm-dd
  let filterEndDate = null;   // ISO date string yyyy-mm-dd
  let filterSprintMode = 0; // 0 = Todos, 1 = Solo sin sprint, 2 = Por sprint específico
  let filterSprintId = null; // Sprint ID when mode = 2
  let sprints = [];

  const sprintModeOptions = ["Todos los tickets", "Sin sprint asignado", "Por sprint específico"];

  // Load sprints for filter
  onMount(() => {
    loadSprints();
  });

  async function loadSprints() {
    try {
      const snapshot = await db.collection("sprints").orderBy("createdDate", "desc").get();
      sprints = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name, 
        status: doc.data().status 
      }));
    } catch (error) {
      console.error("Error loading sprints:", error);
    }
  }

  // Map area select index to category value: areaSelect 0 = Todos, 1 = Sistemas => category 0, 2 => category 1, etc.
  function areaSelectToCategory(areaIdx) {
    if (areaIdx === 0) return null;
    return areaIdx - 1;
  }

  onMount(() => {
    loadFirebaseData();
  });

  function buildQuery() {
    let q = db.collection('tickets');

    // Sprint filter
    if (filterSprintMode === 1) {
      // Only tickets without sprint (sprintId is null or doesn't exist)
      q = q.where('sprintId', '==', null);
    } else if (filterSprintMode === 2 && filterSprintId) {
      // Only tickets for specific sprint
      q = q.where('sprintId', '==', filterSprintId);
    }
    // If mode is 0 (Todos), no sprint filter is applied

    // Date range filters: convert ISO date to JS Date and use Firestore Timestamp comparisons
    if (filterStartDate) {
      const sd = new Date(filterStartDate + 'T00:00:00');
      q = q.where('createdDate', '>=', sd);
    }
    if (filterEndDate) {
      // inclusive end of day
      const ed = new Date(filterEndDate + 'T23:59:59.999');
      q = q.where('createdDate', '<=', ed);
    }

    // Status filter
    if (filterStatus !== 0) {
      q = q.where('status','==', filterStatus - 1);
    }

    // Area filter
    const cat = areaSelectToCategory(filterArea);
    if (cat !== null) {
      q = q.where('category','==', cat);
      // If area is Sistemas and an issueType subfilter is set, apply it
      if (cat === 0 && filterIssueType !== null && filterIssueType !== undefined) {
        q = q.where('issueType','==', Number(filterIssueType));
      }
    }

    return q;
  }

  function loadFirebaseData() {
    if (unsubscribe) unsubscribe();
    loading = true;
  // Firestore requires that range filters are accompanied by an orderBy on the same field
  // We'll order by createdDate desc, then priority
  const q = buildQuery().orderBy('createdDate','desc').orderBy('priority','desc');

    unsubscribe = q.onSnapshot(async (qs) => {
      const tmp = [];
      qs.forEach((doc) => {
        const t = doc.data();
        t.id = doc.id;
        t.did = doc.id;
        // normalize numeric fields
        if (t.status !== undefined && t.status !== null) t.status = Number(t.status);
        if (t.priority !== undefined && t.priority !== null) t.priority = Number(t.priority);
        if (t.area !== undefined && t.area !== null) t.category = Number(t.area);
        else if (t.category !== undefined && t.category !== null) t.category = Number(t.category);
        if (t.issueType !== undefined && t.issueType !== null) t.issueType = Number(t.issueType);
        if (t.requestingArea !== undefined && t.requestingArea !== null) t.requestingArea = Number(t.requestingArea);

        // Set requesting area name
        t.requestingAreaName = areaOptions[t.requestingArea] || 'Sin asignar';

        tmp.push(t);
      });
      tickets = tmp;
      await tick();
      if (!datatable) {
        loadDataTable();
      } else {
        datatable.clear();
        datatable.rows.add(tickets).draw(false);
      }
      loading = false;
    });
  }

  function loadDataTable() {
    if (dataTableInitialized) return;
    datatable = jQuery('#tickets-filter-admin').DataTable({
      data: tickets,
      columns: [
        { data: 'ticketNumber', name: 'No. Ticket', render: function(d,t,r){ return '<a href="#/ticketsedit/'+r.id+'">#'+d+'</a>' } },
        { data: 'title', name: 'Título' },
        { data: 'status', name: 'Estado', render: function(d){ return ['Abierto','En Progreso','Resuelto','Cerrado','Cancelado'][Number(d)] || '' } },
        { data: 'priority', name: 'Prioridad', render: function(d){ return ['Baja','Normal','Alta','Crítica'][Number(d)] || '' } },
        { data: 'estimatedHours', name: 'Estimación (hrs)', render: function(d){ return d === undefined || d === null ? '' : String(Number(d)) } },
        { data: 'category', name: 'Área', render: function(d){ return ['Sistemas','Administrativo','Recursos Humanos','Mantenimiento','Comercial','Gerencia'][Number(d)] || '' } },
        { data: 'issueType', name: 'Tipo incidencia', render: function(d){ return d === undefined || d === null ? '' : ['Soporte técnico','Requerimiento nuevo','Bug/Error'][Number(d)] || '' } },
        { data: 'requestingAreaName', name: 'Área solicitante', width: 'auto' },
        { data: 'reportedByName', name: 'Reportado por' },
        { 
          data: 'sprintId', 
          name: 'Sprint', 
          render: function(d) { 
            if (!d) return 'Sin sprint';
            const sprint = sprints.find(s => s.id === d);
            return sprint ? sprint.name : 'Sprint desconocido';
          } 
        },
        { data: 'createdDate', name: 'Fecha', render: function(d){ return d ? (new Date(d.seconds ? d.seconds * 1000 : d)).toLocaleString() : '' } }
      ]
    });
    dataTableInitialized = true;
  }

  // Re-run query when filters change (debounced, only after initial mount)
  let _filterTimer = null;
  let _initialized = false;

  function scheduleReload() {
    if (_filterTimer) clearTimeout(_filterTimer);
    _filterTimer = setTimeout(() => {
      loadFirebaseData();
      _filterTimer = null;
    }, 150);
  }

  onMount(() => {
    loadFirebaseData();
    _initialized = true;
  });

  // Watch only the filter variables; run scheduler after initial mount
  $: if (_initialized) {
    // reference the vars so Svelte tracks them as dependencies
    filterStatus; filterArea; filterIssueType; filterStartDate; filterEndDate; filterSprintMode; filterSprintId;
    scheduleReload();
  }

  onDestroy(() => {
    if (_filterTimer) {
      clearTimeout(_filterTimer);
      _filterTimer = null;
    }
    if (unsubscribe) {
      try { unsubscribe(); } catch (e) { /* ignore */ }
      unsubscribe = null;
    }
    dataTableInitialized = false;
  });
</script>

<div class="page-content">
    <TitleBar title="Administración de Tickets" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración de Tickets</h4>

                    {#if !$permissions.admin}
                        <div class="alert alert-warning">Acceso denegado. Solo administradores pueden ver este módulo.</div>
                        {:else}
                        <div class="card">
                            <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-3">
                                <label>Estatus</label>
                                <ListSelect options={statusOptions} bind:value={filterStatus} inlist={false} />
                                </div>
                                <div class="col-md-3">
                                <label>Área</label>
                                <ListSelect options={areaOptions} bind:value={filterArea} inlist={false} />
                                </div>
                                <div class="col-md-3">
                                <label>Tipo incidencia</label>
                                {#if filterArea === 1}
                                  <ListSelect options={issueTypes} bind:value={filterIssueType} inlist={false} />
                                {:else}
                                  <div class="text-muted">Seleccione Área = Sistemas para subfiltrar</div>
                                {/if}
                                </div>
                                <div class="col-md-3">
                                <label>Filtro por Sprint</label>
                                <ListSelect options={sprintModeOptions} bind:value={filterSprintMode} inlist={false} />
                                </div>
                            </div>
                            {#if filterSprintMode === 2}
                            <div class="row mb-3">
                                <div class="col-md-3">
                                <label>Seleccionar Sprint</label>
                                <select class="form-control" bind:value={filterSprintId}>
                                  <option value={null}>-- Seleccione un sprint --</option>
                                  {#each sprints as sprint}
                                    <option value={sprint.id}>{sprint.name} ({sprint.status === 'active' ? 'Activo' : sprint.status === 'planned' ? 'Planificado' : 'Completado'})</option>
                                  {/each}
                                </select>
                                </div>
                            </div>
                            {/if}
                            <div class="row mb-3">
                                <div class="col-md-3">
                                <label>Fecha desde</label>
                                <input type="date" class="form-control" bind:value={filterStartDate} />
                                </div>
                                <div class="col-md-3">
                                <label>Fecha hasta</label>
                                <input type="date" class="form-control" bind:value={filterEndDate} />
                                </div>
                            </div>

                            <table id="tickets-filter-admin" class="table table-striped table-bordered dt-responsive nowrap" style="width:100%">
                              <thead>
                                <tr>
                                    <th>No. Ticket</th>
                                    <th>Título</th>
                                    <th>Estado</th>
                                    <th>Prioridad</th>
                                    <th>Estimación (hrs)</th>
                                    <th>Categoría</th>
                                    <th>Tipo incidencia</th>
                                    <th>Área solicitante</th>
                                    <th>Reportado por</th>
                                    <th>Sprint</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            </table>
                            </div>
                        </div>
                    {/if}

                </div>
            </div>
        </div>
    </div>
    
        

</div>
