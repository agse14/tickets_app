<script>

export let inlist;
export const options = ["Activo", "Entregado", "Vencido"];



export let value = 0;


  function select(idx) {
		value = idx;
	}
</script>
{#if !inlist}
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