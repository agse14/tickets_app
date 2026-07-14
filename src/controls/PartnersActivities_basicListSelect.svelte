<script>

export let inlist;
export const options = {"feed": "Alimentaci\u00f3n por sonda", "clean": "Aseo b\u00e1sico del ba\u00f1o y cuarto", "confort": "Confort  (Imagen, Limpieza, Cuidado)", "crane": "Manejo de gr\u00faa y arn\u00e9s", "vitals": "Medici\u00f3n de signos vitales", "presion": "Medir presi\u00f3n arterial", "move": "Movilzaci\u00f3n", "shots": "Aplicaci\u00f3n de inyecciones", "activity": "Acompa\u00f1ar a actividad", "medicine": "Preparaci\u00f3n y administraci\u00f3n de medicamentos", "diaper": "Cambio de pa\u00f1al", "heal": "Curaciones b\u00e1sicas: yagas de presi\u00f3n, heridas quirurgicas", "temp": "Medir temperatura", "gastric": "Administraci\u00f3n e higiene de sonda g\u00e1strica", "cook": "Cocina b\u00e1sica para paciente", "insuline": "Aplicaci\u00f3n Insulina", "sugar": "Test de Azucar", "doc_visit": "Acompa\u00f1ar al Doctor", "oxigen": "Manejo de concentrador de ox\u00edgeno", "bath": "Ba\u00f1o en cama o regadera", "pulse": "Medir pulso"};


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