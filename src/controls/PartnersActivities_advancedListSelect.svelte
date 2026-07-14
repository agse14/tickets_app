<script>

export let inlist;
export const options = {"traquea": "Traqueostim\u00eda, aspiraci\u00f3n de secreciones", "foley": "Manejo de sonda Foley vaso-gastrica", "catheter": "Manejo de catheter central", "diet": "Preparaci\u00f3n de dieta blanda. Gastrostom\u00eda", "feed": "Manejo de bomba de alimentaci\u00f3n", "canal": "Canalizaci\u00f3n", "liquids": "Manejo de perfil de liquidos. (Cuantificaci\u00f3n y control)", "catheter_per": "Manejo de catheter periferico", "cardio_advanced": "Reanimaci\u00f3n cardiopulmonar avanzada", "vitals": "Manejo de monitor de signos vitales", "ventilator": "Manejo de ventilador artificial", "dialisis": "Manejo de di\u00e1lisis manual", "premature": "Ni\u00f1o prematuro", "portacad": "Manejo de catheter portacad", "infusion": "Manejo de bomba de infusi\u00f3n", "foot": "Curaci\u00f3n de pie diab\u00e9tico", "cardio": "Reanimaci\u00f3n cardiopulmonar b\u00e1sica", "bronquial": "Realizaci\u00f3n de lavado bronquial", "rcp": "RCP pedi\u00e1trico", "oximeter": "Manejo oximetro"};


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