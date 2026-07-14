<script>
import BranchesReport from "./BranchesReport.svelte"

export let branch = "";

let branchInfo;
loadBranch();
async function loadBranch()  {
    if(branch != ""){
        const branchData = await db.collection("branches").doc(branch).get();
        branchInfo = branchData.data();
    }
}
</script>

<div class="row mb-4">
    <div class="col">
    {#if branchInfo?.map != undefined}
    <h5>Mapa</h5>
    <img src={branchInfo?.map} class="map-image" />

    {/if}
    </div>
</div>
<BranchesReport branches={branch} />

<style>
    .map-image {
        max-width: 100%; /* Ajusta al contenedor */
        width: 1200px; /* Ancho fijo */
        height: auto; /* Mantiene la proporción */
        border: 1px solid #ccc; /* (Opcional) Añadir un borde */
    }
</style>