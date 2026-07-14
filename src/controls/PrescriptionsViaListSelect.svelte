<script>

export let inlist;
export const options = ["oral", "intravenoso", "otico", "oftalmica", "intramuscular", "subcutáneo"];


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