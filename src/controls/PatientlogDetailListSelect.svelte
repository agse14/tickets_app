<script>
  export let inlist;
  export const options = [
    "Anticipo",
    "Ajuste de sueldo",
    "Anticipo N\u00f3mina Tarjeta",
    "Bono (+)",
    "Deducci\u00f3n de uniforme",
    "Deducciones",
    "Complemento de n\u00f3mina (+)",
    "Horas extras (+)",
    "Incapacidad (+)",
    "Infonavit",
    "Pago de mas",
    "Pr\u00e9stamo",
    "Vacaciones Pagadas(+)",
    "D\u00eda festivo (+)",
    "Pensi\u00f3n alimenticia",
    "IMSS",
    "Retardos",
    "Apoyo Covid (+)",
    "Otros + (+)",
    "Otros -",
    "PTU (+)",
    "Recomienda y Gana (+)",
    "Aguinaldo (+)",
    "Apoyo a Enfermedad (+)",
    "Comisión Depósito (+)",
    "Faltas",
    "Vacaciones Tomadas(+)",
    "Finiquito",
  ];

  export let view = "default";
  export let value = 0;
  export let prefix = "";

  function select(idx) {
    value = idx;
  }

  let highlightedIndices = new Set([
    3, 6, 7, 8, 12, 13, 17, 18, 20, 21, 22, 23, 24, 26
  ]);

  let optionsWithHighlight = options.map((op, i) => ({
    text: op,
    shouldHighlight: highlightedIndices.has(i),
  }));
</script>

{#if view == "check"}
  {#each options as op, i}
    <div class="form-check mb-2">
      <input
        class="form-check-input"
        type="radio"
        bind:group={value}
        id="{prefix}radio{i}"
        value={i}
      />
      <label class="form-check-label" for="{prefix}radio{i}">
        {op}
      </label>
    </div>
  {/each}
  <hr />
{:else if !inlist}
  <div class="">
    <div class="dropdown">
      <button
        class="btn btn-secondary dropdown-toggle"
        type="button"
        id="dropdownMenuButton"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {#if value != null && typeof options[value] !== "undefined"}{options[
            value
          ]}{:else}Seleccionar{/if}<i class="mdi mdi-chevron-down"></i>
      </button>
      <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {#each optionsWithHighlight as item, i}
          <a
            class="dropdown-item {item.shouldHighlight ? 'highlighted' : ''}"
            href="javascript:void(0);"
            on:click={function () {
              select(i);
            }}>{item.text}</a
          >
        {/each}
      </div>
    </div>
  </div>
{:else if value != null && typeof options[value] !== "undefined"}
  {options[value]}
{:else}
  -
{/if}

<style>
  /* .dropdown-item:hover { 
     background-color: gray;  
     Puedes cambiar esto al color que desees 
     Agrega otros estilos de resaltado según tus preferencias 
  } */

  .highlighted {
    background-color: #90ee90; /* Color especial para los elementos resaltados */
    /* Otros estilos para elementos resaltados */
  }
</style>
