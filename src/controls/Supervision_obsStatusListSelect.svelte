<script>
  import { permissions } from "../stores.js";
  import { get } from "svelte/store";

  export let inlist;
  export const options = ["Nuevo", "En Revision", "Completado"];

  export let view = "default";
  export let value = 0;
  export let prefix = "";

  // let userPermissions = get(permissions); // Obtiene los permisos actuales del usuario

  function select(idx) {
    value = idx;
  }

  // Filtrar opciones según los permisos del usuario
  let filteredOptions = options.filter((op, i) => {
    if (op === "En Revision" && !$permissions.admin_hours && !$permissions.admin) {
      return false;
    }
    if (op === "Completado" &&  !$permissions.operations && !$permissions.admin) {
      return false;
    }
    return true;
  });
</script>
{#if view=="check" }
  {#each filteredOptions as op, i}
    <div class="form-check mb-2">
      <input class="form-check-input" type="radio" bind:group={value} id="{prefix}radio{i}" value={i}>
      <label class="form-check-label" for="{prefix}radio{i}">
        {op}
      </label>
    </div>
  {/each}
  <hr />
{:else if !inlist }
  <div class="">
    <div class="dropdown">
      <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        {#if value != null && typeof filteredOptions[value] !== 'undefined'}
          {filteredOptions[value]}
        {:else}
          Seleccionar
        {/if}
        <i class="mdi mdi-chevron-down"></i>
      </button>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {#each filteredOptions as op, i}
          <a class="dropdown-item" href="javascript:void(0);" on:click={function(){select(i)}}>{op}</a>
        {/each}
      </div>
    </div>
  </div>
{:else if value != null && typeof filteredOptions[value] !== 'undefined'}
  {filteredOptions[value]}
{:else}
  -
{/if}