<script>

export let inlist;
export const options = {"admin_hours": "Administrar Roles de trabajo", "admin_inventory": "Administrar Inventario", "supervision": "Crear reportes de supervision", "view_hours": "Ver Asignaciones en Calendario", "supervision_tags": "Rondas de Revisiones (tags)", "accounting": "Contabilidad", "hr": "Recursos Humanos", "oxigenica": "Administrar Concentradores", "patients": "Ver todos los residentes", "admin_medi": "Administrar App Medi", "asign_inventory": "Capturar Inventario semanal", "self_hr": "Capturar perfil propio de RH", "social_branch": "Actualizaciones sociales estancias", "admin_branch": "Administrar Estancia"};


export let view = "default";
export let value = 0;
export let prefix = "";


  function select(idx) {
		value = idx;
	}
</script>
{#if view=="check" }
          {#each options as op,i}
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
          {#if value != null && typeof options[value] !== 'undefined'}{options[value]}{:else}Seleccionar{/if}<i class="mdi mdi-chevron-down"></i>
      </button>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          {#each options as op,i}
            <a class="dropdown-item" href="javascript:void(0);" on:click={function(){select(i)}}>{op}</a>
          {/each}
          
      </div>
  </div>
</div>
{:else if value != null && typeof options[value] !== 'undefined'}
        {options[value]}
      {:else}
        -
      {/if}