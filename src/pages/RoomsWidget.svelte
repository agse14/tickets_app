<script>
  import { onMount } from "svelte";
  // Sin dependencias de Flowbite, solo Svelte y clases utilitarias
  export let roomsByBranchesAndStatus = {};

  let branchNames = {};

  onMount(() => {
    db.collection("branches").get().then(snapshot => {
      snapshot.forEach(doc => {
        branchNames[doc.id] = doc.data().name;
      });
    });
  });
</script>

<div class="room-card" style="padding: 2rem; background: #fff; border-radius: 1rem; box-shadow: 0 2px 12px #0002; max-width: 480px; margin: 2rem auto;">
  <h3 style="font-size: 1.4rem; font-weight: bold; margin-bottom: 1.2rem; color: #222;">Habitaciones disponibles</h3>
  <div style="max-height:360px; overflow:auto;">
    {#if Object.keys(roomsByBranchesAndStatus).length === 0}
      <div style="color: #888; padding: 1rem; text-align: center;">No hay habitaciones disponibles.</div>
    {:else}
      {#each Object.entries(roomsByBranchesAndStatus) as [branch, branchRooms]}
        <div style="margin-bottom: 1.5rem;">
          <div style="font-weight: 600; color: #1976d2; margin-bottom: 0.5rem;">{branchNames[branch] ?? branch}</div>
          <ul style="list-style: none; margin: 0; padding: 0;">
            {#each branchRooms as room}
              <li style="display: flex; align-items: center; gap: 1rem; padding: 0.7rem 0; border-bottom: 1px solid #eee;">
                <img src="/favicon.png" alt="Habitación" style="width:36px;height:36px;border-radius:50%;background:#f3f3f3;object-fit:cover;" />
                <div style="flex:1; min-width:0;">
                  <div style="font-size: 1rem; font-weight: 500; color: #222; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{room.name ?? room.id}</div>
                  <div style="font-size: 0.85rem; color: #888;">{room.type === 0 ? 'Individual' : 'Compartida'}</div>
                </div>
                <div style="font-size: 1rem; font-weight: 600; color: #1976d2; min-width: 60px; text-align: right;">${room.cost}</div>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
:global(.draggable-widget) {
  user-select: none;
  transition: box-shadow 0.2s;
}
:global(.draggable-widget:active) {
  box-shadow: 0 4px 16px #0004;
}
</style>
