<script>

export let inlist;
export const options = {"movil": "Movilicaci\u00f3n en cama", "company": "Acompa\u00f1amiento: Asistir citas Dr.", "confort": "Confort (Imagen, Limpieza, Cuidado)", "campany_day": "Compa\u00f1ia de d\u00eda", "gastro": "Sonda de gastostomia", "travel": "Viajar Fuera de la ciudad", "diet": "Suministrar dieta por sonda", "wash": "Lavar ropa en lavadora", "diaper": "Cambio de pa\u00f1al", "cook": "Cocina b\u00e1sica para px", "bath": "Ba\u00f1o en regadera", "hola": "Holador", "money": "Caja chica: compras, supermercado,etc.", "drive": "Manejar (Licencia de conducir)", "cleaning": "Aseo b\u00e1sico depto", "medicine": "Preparaci\u00f3n y administraci\u00f3n de medicamentos", "vitals": "Toma de signos vitales", "pet": "Pasear mascota", "company_night": "Compa\u00f1ia de noche"};


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