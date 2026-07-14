<script>
  import { onMount } from 'svelte';
  import TitleBar from "../TitleBar.svelte";
  // import { fbuser, permissions, profile } from "./stores.js";

  let range = 'month';
  let customFrom = '';
  let customTo = '';
  let loading = false;
  const ticketStatus = {
    0: 'Abierto',
    1: 'En Progreso',
    2: 'Resuelto',
    3: 'Cerrado',
    4: 'Cancelado'
  };

  // counts per status
  let stats = { total: 0, byStatus: { 0:0, 1:0, 2:0, 3:0, 4:0 } };
  let chart;

  // Filters
  let selectedArea = 'all';
  let selectedPriority = 'all';
  let selectedAssignedTo = 'all';

  let areaOptions = [];
  const ticketPriority = { 0: 'Baja', 1: 'Normal', 2: 'Alta', 3: 'Crítica' };
  let priorityOptions = [];
  let assignedToOptions = [];

  // helper to load external script
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => res();
      s.onerror = () => rej(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureChartAndPlugin() {
    if (!window.Chart) {
      await loadScript('https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js');
    }
    if (!window.ChartDataLabels) {
      await loadScript('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js');
    }
    // register plugin if needed
    try {
      if (window.Chart && window.ChartDataLabels && window.Chart.register) {
        window.Chart.register(window.ChartDataLabels);
      }
    } catch (e) {
      console.warn('Could not register ChartDataLabels plugin', e);
    }
  }

  // console.log('User permissions:', $permissions);

  function getRangeDates() {
    const now = DateTime.local();
    switch (range) {
      case 'day':
        return { from: now.startOf('day'), to: now.endOf('day') };
      case 'week':
        return { from: now.startOf('week'), to: now.endOf('week') };
      case 'month':
        return { from: now.startOf('month'), to: now.endOf('month') };
      case 'year':
        return { from: now.startOf('year'), to: now.endOf('year') };
      case 'custom':
        // validate custom dates
        const f = customFrom ? DateTime.fromISO(customFrom) : null;
        const t = customTo ? DateTime.fromISO(customTo) : null;
        if (!f || !f.isValid || !t || !t.isValid) {
          console.warn('Invalid custom range provided, falling back to current month');
          return { from: now.startOf('month'), to: now.endOf('month') };
        }
        return { from: f.startOf('day'), to: t.endOf('day') };
      default:
        return { from: now.startOf('month'), to: now.endOf('month') };
    }
  }

  async function loadStats() {
    loading = true;
    stats = { total: 0, byStatus: { 0:0, 1:0, 2:0, 3:0, 4:0 } };
    const { from, to } = getRangeDates();
    try {
      if (!from || !from.isValid || !to || !to.isValid) {
        throw new Error('Invalid range dates');
      }
      const startTs = firebase.firestore.Timestamp.fromDate(from.toJSDate());
      const endTs = firebase.firestore.Timestamp.fromDate(to.toJSDate());

      let queryRef = db.collection('tickets')
        .where('createdDate', '>=', startTs)
        .where('createdDate', '<=', endTs);

      if (selectedArea !== 'all') {
        const a = isNaN(Number(selectedArea)) ? selectedArea : Number(selectedArea);
        queryRef = queryRef.where('area', '==', a);
      }
      if (selectedPriority !== 'all') {
        const p = isNaN(Number(selectedPriority)) ? selectedPriority : Number(selectedPriority);
        queryRef = queryRef.where('priority', '==', p);
      }
      if (selectedAssignedTo !== 'all') {
        queryRef = queryRef.where('assignedToName', '==', selectedAssignedTo);
      }

      const q = await queryRef.get();
      const docs = [];
      q.forEach(d => docs.push({ id: d.id, ...d.data() }));

      // normalize numeric fields
      docs.forEach(d => {
        if (d.status !== undefined && d.status !== null) d.status = Number(d.status);
        if (d.priority !== undefined && d.priority !== null) d.priority = Number(d.priority);
        if (d.area !== undefined && d.area !== null) d.area = Number(d.area);
      });

      // populate filter option lists from returned docs
      const areasSet = new Map();
      const prSet = new Set();
      const asSet = new Set();
      docs.forEach(d => {
        if (d.area !== undefined && d.area !== null) areasSet.set(String(d.area), String(d.area));
        if (d.priority !== undefined && d.priority !== null) prSet.add(String(d.priority));
        if (d.assignedToName) asSet.add(d.assignedToName);
      });
      areaOptions = [{ value: 'all', label: 'Todos' }].concat(Array.from(areasSet.keys()).map(v => ({ value: v, label: v })));
      priorityOptions = [{ value: 'all', label: 'Todos' }].concat(Array.from(prSet).map(v => ({ value: v, label: ticketPriority[v] || v })));
      assignedToOptions = [{ value: 'all', label: 'Todos' }].concat(Array.from(asSet).map(v => ({ value: v, label: v })));

      stats.total = docs.length;
      // reset byStatus
      stats.byStatus = { 0:0, 1:0, 2:0, 3:0, 4:0 };
      docs.forEach(d => {
        const s = d.status !== undefined && d.status !== null ? d.status : -1;
        if (s >= 0 && stats.byStatus[s] !== undefined) stats.byStatus[s]++;
      });

      renderChart(docs, from, to);
    } catch (e) {
      console.error('Error loading ticket stats', e);
    }
    loading = false;
  }

  function renderChart(docs, from, to) {
    // Decide bucket size depending on range length
    const daysSpan = Math.max(1, Math.round(to.diff(from, 'days').days));
    let unit = 'day';
    if (daysSpan <= 1) unit = 'hour';
    else if (daysSpan <= 31) unit = 'day';
    else if (daysSpan <= 92) unit = 'week';
    else unit = 'month';

    // build buckets
    const buckets = [];
    const labels = [];
    let cursor = from.startOf(unit === 'hour' ? 'hour' : unit === 'day' ? 'day' : unit === 'week' ? 'week' : 'month');
    while (cursor <= to) {
      if (unit === 'hour') labels.push(cursor.toFormat('HH:00'));
      else if (unit === 'day') labels.push(cursor.toISODate());
      else if (unit === 'week') labels.push('W ' + cursor.toFormat('kkkk-LL-dd'));
      else labels.push(cursor.toFormat('yyyy-LL'));
      buckets.push({ start: cursor, end: unit === 'hour' ? cursor.plus({ hours: 1 }) : unit === 'day' ? cursor.plus({ days: 1 }) : unit === 'week' ? cursor.plus({ weeks: 1 }) : cursor.plus({ months: 1 }) });
      cursor = buckets[buckets.length - 1].end;
    }

    // prepare counts per status per bucket
    const countsByStatus = {};
    Object.keys(ticketStatus).forEach(k => { countsByStatus[k] = buckets.map(() => 0); });

    docs.forEach(d => {
      const cd = d.createdDate instanceof firebase.firestore.Timestamp ? DateTime.fromJSDate(d.createdDate.toDate()) : DateTime.fromISO(d.createdDate);
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (cd >= b.start && cd < b.end) {
          const s = d.status !== undefined && d.status !== null ? String(d.status) : null;
          if (s !== null && countsByStatus[s] !== undefined) countsByStatus[s][i]++;
          break;
        }
      }
    });

    // colors for statuses (tweak as needed)
    const statusColors = {
      0: 'rgba(59,130,246,0.9)', // blue - Abierto
      1: 'rgba(245,158,11,0.9)', // amber - En Progreso
      2: 'rgba(34,197,94,0.9)',  // green - Resuelto
      3: 'rgba(107,114,128,0.9)', // gray - Cerrado
      4: 'rgba(239,68,68,0.9)'   // red - Cancelado
    };

    const datasets = Object.keys(ticketStatus).map(k => ({
      label: ticketStatus[k],
      data: countsByStatus[k],
      backgroundColor: statusColors[k] || 'rgba(99,102,241,0.9)',
      stack: 'tickets'
    }));

    const data = { labels, datasets };

    // load Chart.js if not present
    if (!window.Chart) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
      s.onload = () => createChart(data);
      document.head.appendChild(s);
    } else {
      createChart(data);
    }
  }

  function createChart(data) {
    ensureChartAndPlugin().then(() => {
      const ctx = document.getElementById('ticketsChart').getContext('2d');
      if (chart) chart.destroy();
      chart = new Chart(ctx, {
        type: 'bar',
        data,
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            datalabels: {
              color: '#111',
              anchor: 'end',
              align: 'end',
              formatter: function(value, context) {
                // show only total on top dataset rendering: compute stack total for this index
                try {
                  const idx = context.dataIndex;
                  const datasets = context.chart.data.datasets;
                  let total = 0;
                  for (let i = 0; i < datasets.length; i++) total += (datasets[i].data[idx] || 0);
                  return total > 0 ? total : '';
                } catch (e) {
                  return '';
                }
              },
              font: { weight: '600' }
            }
          },
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true }
          }
        }
      });
    }).catch(e => {
      console.warn('Chart or plugin failed to load:', e);
    });
  }

  onMount(() => {
    loadStats();
  });

</script>

<div class="page-content">
    <TitleBar title="Tickets de Soporte" base="Administración" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">

                    <div class="container py-4">
                        <h4>Histórico de Tickets</h4>
                        <div class="row my-3">
                            <div class="col-auto">
                            <select bind:value={range} class="form-control" on:change={loadStats}>
                                <option value="day">Día</option>
                                <option value="week">Semana</option>
                                <option value="month">Mes</option>
                                <option value="year">Año</option>
                                <option value="custom">Rango personalizado</option>
                            </select>
                            </div>
                            {#if range === 'custom'}
                            <div class="col-auto">
                                <input type="date" bind:value={customFrom} class="form-control" />
                            </div>
                            <div class="col-auto">
                                <input type="date" bind:value={customTo} class="form-control" />
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-primary" on:click={loadStats}>Aplicar</button>
                            </div>
                            {/if}
                        </div>

                        <div class="row mb-3">
                          <div class="col-md-3">
                            <label>Área</label>
                            <select class="form-control" bind:value={selectedArea} on:change={loadStats}>
                              {#each areaOptions as ao}
                                <option value={ao.value}>{ao.label}</option>
                              {/each}
                            </select>
                          </div>
                          <div class="col-md-3">
                            <label>Prioridad</label>
                            <select class="form-control" bind:value={selectedPriority} on:change={loadStats}>
                              {#each priorityOptions as po}
                                <option value={po.value}>{po.label}</option>
                              {/each}
                            </select>
                          </div>
                          <div class="col-md-3">
                            <label>Asignado a</label>
                            <select class="form-control" bind:value={selectedAssignedTo} on:change={loadStats}>
                              {#each assignedToOptions as ao}
                                <option value={ao.value}>{ao.label}</option>
                              {/each}
                            </select>
                          </div>
                        </div>

                                        <div class="row mb-3">
                                          <div class="col-md-3">
                                            <div class="card p-3">
                                              <h6>Total</h6>
                                              <div class="display-4">{stats.total}</div>
                                            </div>
                                          </div>
                                          {#each Object.keys(ticketStatus) as st}
                                          <div class="col-md-3">
                                            <div class="card p-3">
                                              <h6>{ticketStatus[st]}</h6>
                                              <div class="display-4">{stats.byStatus[st]}</div>
                                            </div>
                                          </div>
                                          {/each}
                                        </div>

                        <div class="card p-3">
                            <canvas id="ticketsChart" height="90"></canvas>
                        </div>
                        </div>

                </div>
            </div>
        </div>
    </div>  
</div>



<style>
  .card { border-radius: 10px; box-shadow: 0 6px 18px rgba(2,6,23,0.06); }
</style>
