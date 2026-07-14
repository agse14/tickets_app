<!-- Propuesta 1: Diseño CSS Elegante (Versión Simple para testing) -->
<script>
    import TitleBar from "../TitleBar.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { onMount } from "svelte";
    import { pop } from "svelte-spa-router";

    export const params = {};   

    let selectedBranch = "";
    let selectedDate = DateTime.local().setLocale("es-mx").toISODate();
    let workersData = [];
    let branchName = "";
    let loading = false;

    onMount(() => {
        selectedDate = DateTime.local().setLocale("es-mx").toISODate();
    });

    function getRatingColor(rating) {
        if (rating >= 80) return "success";
        if (rating >= 60) return "warning";
        if (rating >= 40) return "danger";
        return "secondary";
    }

    // Simulación de datos para testing del diseño
    $: if (selectedBranch && selectedDate) {
        // Datos de prueba
        workersData = [
            {
                id: "1",
                name: "ANDRES SANCHEZ",
                totalAssignments: 1,
                assignments: [
                    { name: "Grupo 1", type: "grupo", shift: "day", shiftText: "Día" }
                ],
                dayShifts: [{ name: "Grupo 1" }],
                nightShifts: [],
                dayActivities: {
                    total: 88,
                    rating100: 16,
                    rating80: 12,
                    rating50: 0,
                    rating20: 8,
                    rating0: 52,
                    average: 25,
                    byCategory: { critica: 20, normal: 50, flexible: 18 }
                },
                nightActivities: {
                    total: 0,
                    rating100: 0,
                    rating80: 0,
                    rating50: 0,
                    rating20: 0,
                    rating0: 0,
                    average: 0,
                    byCategory: { critica: 0, normal: 0, flexible: 0 }
                }
            }
        ];
        branchName = "La Salle";
        loading = false;
    }
</script>

<div class="page-content">
    <TitleBar title="Calificación de Responsables - Diseño Elegante" base="Supervisión" />
    
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <label for="branch" class="form-label">Estancia</label>
                            <BranchesSearchList bind:selectedBranch={selectedBranch} />
                        </div>
                        <div class="col-md-4">
                            <label for="date" class="form-label">Fecha</label>
                            <input 
                                type="date" 
                                class="form-control" 
                                bind:value={selectedDate}
                            />
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-secondary" on:click={() => pop()}>
                                <i class="bx bx-arrow-back"></i> Regresar
                            </button>
                        </div>
                    </div>

                    {#if selectedBranch && selectedDate}
                        <div class="row mb-3">
                            <div class="col-12">
                                <h4>{branchName} - {selectedDate}</h4>
                            </div>
                        </div>

                        <div class="row">
                            {#each workersData as worker}
                                <div class="col-lg-6 col-xl-4 mb-4">
                                    <div class="worker-card">
                                        <!-- Header con gradiente -->
                                        <div class="worker-card-header">
                                            <div class="worker-avatar">
                                                <i class="bx bx-user-circle"></i>
                                            </div>
                                            <div class="worker-info">
                                                <h5 class="worker-name">{worker.name}</h5>
                                                <div class="worker-assignments-count">
                                                    <i class="bx bx-briefcase"></i>
                                                    {worker.totalAssignments} responsabilidad{worker.totalAssignments !== 1 ? 'es' : ''}
                                                </div>
                                            </div>
                                            <div class="worker-status">
                                                <div class="status-indicator status-active"></div>
                                            </div>
                                        </div>

                                        <div class="worker-card-body">
                                            <!-- Responsabilidades -->
                                            <div class="responsibilities-section">
                                                <h6 class="section-title">
                                                    <i class="bx bx-list-check"></i> Responsabilidades
                                                </h6>
                                                <div class="responsibilities-grid">
                                                    {#each worker.assignments as assignment}
                                                        <div class="responsibility-chip {assignment.type === 'limpieza' ? 'chip-cleaning' : 'chip-group'}">
                                                            <span class="chip-icon">
                                                                {assignment.type === 'limpieza' ? '🧹' : '👥'}
                                                            </span>
                                                            <span class="chip-text">{assignment.name}</span>
                                                            <span class="chip-shift">{assignment.shiftText}</span>
                                                        </div>
                                                    {/each}
                                                </div>
                                            </div>

                                            <!-- Estadísticas Diurnas -->
                                            {#if worker.dayShifts.length > 0}
                                                <div class="stats-section day-stats">
                                                    <div class="stats-header">
                                                        <div class="stats-icon day-icon">
                                                            <i class="bx bx-sun"></i>
                                                        </div>
                                                        <h6 class="stats-title">Turno Diurno</h6>
                                                        <div class="stats-total">{worker.dayActivities.total}</div>
                                                    </div>
                                                    
                                                    <div class="performance-grid">
                                                        <div class="performance-item excellent">
                                                            <div class="perf-number">{worker.dayActivities.rating100 || 0}</div>
                                                            <div class="perf-label">Excelente</div>
                                                            <div class="perf-points">100pts</div>
                                                        </div>
                                                        <div class="performance-item very-good">
                                                            <div class="perf-number">{worker.dayActivities.rating80 || 0}</div>
                                                            <div class="perf-label">Muy Bueno</div>
                                                            <div class="perf-points">80pts</div>
                                                        </div>
                                                        <div class="performance-item regular">
                                                            <div class="perf-number">{worker.dayActivities.rating50 || 0}</div>
                                                            <div class="perf-label">Regular</div>
                                                            <div class="perf-points">50pts</div>
                                                        </div>
                                                        <div class="performance-item bad">
                                                            <div class="perf-number">{worker.dayActivities.rating20 || 0}</div>
                                                            <div class="perf-label">Malo</div>
                                                            <div class="perf-points">20pts</div>
                                                        </div>
                                                        <div class="performance-item very-bad">
                                                            <div class="perf-number">{worker.dayActivities.rating0 || 0}</div>
                                                            <div class="perf-label">Muy Malo</div>
                                                            <div class="perf-points">0pts</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Categorías -->
                                                    {#if worker.dayActivities.byCategory}
                                                        <div class="category-stats">
                                                            <div class="category-item critical">
                                                                <span class="cat-icon">🚨</span>
                                                                <span class="cat-count">{worker.dayActivities.byCategory.critica || 0}</span>
                                                                <span class="cat-label">Críticas</span>
                                                            </div>
                                                            <div class="category-item normal">
                                                                <span class="cat-icon">📋</span>
                                                                <span class="cat-count">{worker.dayActivities.byCategory.normal || 0}</span>
                                                                <span class="cat-label">Normales</span>
                                                            </div>
                                                            <div class="category-item flexible">
                                                                <span class="cat-icon">⏰</span>
                                                                <span class="cat-count">{worker.dayActivities.byCategory.flexible || 0}</span>
                                                                <span class="cat-label">Flexibles</span>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                    
                                                    <!-- Promedio -->
                                                    {#if worker.dayActivities.total > 0}
                                                        <div class="average-score {getRatingColor(worker.dayActivities.average)}">
                                                            <div class="average-number">{worker.dayActivities.average}</div>
                                                            <div class="average-label">Promedio</div>
                                                        </div>
                                                    {:else}
                                                        <div class="no-activities">
                                                            <i class="bx bx-info-circle"></i>
                                                            Sin actividades asignadas
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="alert alert-warning text-center">
                            <i class="bx bx-info-circle fs-4"></i>
                            <h5 class="mt-2">Selecciona estancia y fecha</h5>
                            <p>Selecciona una estancia y fecha para ver el nuevo diseño.</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* ========== PROPUESTA 1: CSS ELEGANTE ========== */
    
    /* Tarjeta principal del trabajador */
    .worker-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: all 0.3s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    
    .worker-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }
    
    /* Header del trabajador */
    .worker-card-header {
        background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    
    .worker-avatar {
        width: 60px;
        height: 60px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
        border: 2px solid rgba(255,255,255,0.3);
    }
    
    .worker-info {
        flex: 1;
    }
    
    .worker-name {
        color: white;
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    
    .worker-assignments-count {
        color: rgba(255,255,255,0.9);
        font-size: 0.85rem;
        margin-top: 0.25rem;
    }
    
    .worker-assignments-count i {
        margin-right: 0.5rem;
    }
    
    .worker-status {
        display: flex;
        align-items: center;
    }
    
    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
    }
    
    .status-active {
        background: #4ade80;
    }
    
    /* Cuerpo de la tarjeta */
    .worker-card-body {
        background: white;
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    /* Sección de responsabilidades */
    .responsibilities-section {
        margin-bottom: 1rem;
    }
    
    .section-title {
        color: #374151;
        font-size: 0.95rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .section-title i {
        color: #6366f1;
    }
    
    .responsibilities-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .responsibility-chip {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .chip-cleaning {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
    }
    
    .chip-group {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
    }
    
    .chip-shift {
        background: rgba(255,255,255,0.2);
        padding: 0.1rem 0.4rem;
        border-radius: 6px;
        font-size: 0.7rem;
    }
    
    /* Sección de estadísticas */
    .stats-section {
        background: #f8fafc;
        border-radius: 16px;
        padding: 1.25rem;
        border: 1px solid #e2e8f0;
    }
    
    .stats-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .stats-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        color: white;
    }
    
    .day-icon {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
    }
    
    .stats-title {
        color: #374151;
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        flex: 1;
    }
    
    .stats-total {
        background: #667eea;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    /* Grid de rendimiento */
    .performance-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .performance-item {
        text-align: center;
        padding: 0.75rem 0.5rem;
        border-radius: 12px;
        transition: all 0.2s ease;
        border: 2px solid transparent;
    }
    
    .performance-item:hover {
        transform: translateY(-2px);
        border-color: currentColor;
    }
    
    .excellent {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }
    
    .very-good {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        color: white;
    }
    
    .regular {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
    }
    
    .bad {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
    }
    
    .very-bad {
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: white;
    }
    
    .perf-number {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }
    
    .perf-label {
        font-size: 0.7rem;
        opacity: 0.9;
        margin-bottom: 0.1rem;
    }
    
    .perf-points {
        font-size: 0.6rem;
        opacity: 0.8;
    }
    
    /* Estadísticas por categoría */
    .category-stats {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .category-item {
        flex: 1;
        text-align: center;
        padding: 0.5rem;
        border-radius: 10px;
        background: white;
        border: 1px solid #e2e8f0;
    }
    
    .critical {
        border-color: #ef4444;
        background: #fef2f2;
    }
    
    .normal {
        border-color: #3b82f6;
        background: #eff6ff;
    }
    
    .flexible {
        border-color: #6b7280;
        background: #f9fafb;
    }
    
    .cat-icon {
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .cat-count {
        display: block;
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 0.1rem;
    }
    
    .cat-label {
        display: block;
        font-size: 0.7rem;
        color: #6b7280;
    }
    
    /* Promedio destacado */
    .average-score {
        text-align: center;
        padding: 1rem;
        border-radius: 16px;
        color: white;
        position: relative;
        overflow: hidden;
    }
    
    .average-score.success {
        background: linear-gradient(135deg, #10b981, #059669);
    }
    
    .average-score.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
    }
    
    .average-score.danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    
    .average-score.secondary {
        background: linear-gradient(135deg, #6b7280, #4b5563);
    }
    
    .average-number {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }
    
    .average-label {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    /* Sin actividades */
    .no-activities {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
        font-style: italic;
    }
    
    .no-activities i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        display: block;
    }
    
    /* Responsivo */
    @media (max-width: 768px) {
        .performance-grid {
            grid-template-columns: repeat(3, 1fr);
        }
        
        .worker-card-header {
            padding: 1rem;
        }
        
        .worker-card-body {
            padding: 1rem;
        }
    }
</style>
