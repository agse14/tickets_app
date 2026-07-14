<script>
  export let inlist;
  export let options = [
    "Cuidados básicos",
    "Control de insumos",
    "Higiene del paciente",
    "Higiene de la Estancia",
    "Atención al cliente",
    "Mantenimiento",
    "Manejo de tratamiento médico",
    "Surtimiento y Control de Medicamentos",
    "Traslado del paciente",
    "Negación a seguir tratamiento médico",
    "Alimentación",
    "Trato del personal al paciente",
    "Trato del personal a Familiar",
    "Otro"
  ];

  export let view = "default";
  export let value = 0;
  export let prefix = "";
  export let type = 0;

  function select(idx) {
    value = idx;
  }
/*
- Falta
- Retardo 
- Conductas no deseadas 
- Faltas de respeto hacia compañeros o pacientes 
- Omisión de actividades
- incumplimiento de horarios de actividades 
- incumplimiento de supervsiones 
- Actividades mal realizadas
- Otros
**/
  let personalOptions = [
    "Falta",
    "Retardo",
    "Conductas no deseadas",
    "Faltas de respeto hacia compañeros o pacientes",
    "Omisión de actividades",
    "Incumplimiento de horarios de actividades",
    "Incumplimiento de supervisiones",
    "Actividades mal realizadas",
    "Altas / Bajas de personal",
    "Citatorios con RH",
    "Solicitudes de préstamos / Anticipos del personal",
    "Solicitudes de vacaciones del personal",
    "Movimientos o ajustes de puesto y salario",
    "Pagos adicionales por alguna situación en específico extraordinaria",
    "Apoyo en temas específicos relacionados con el personal",
    "Eventos adversos",
    "Otro"
  ];
   /**
    - Higiene general 
    - control de insumos 
    - seguimientos médicos y de cuidados básicos 
    - Problemas de comunicación con  responsable de unidad 
    - otros
   */
  let familiarOptions = [
    "Higiene general",
    "Control de insumos",
    "Seguimientos médicos y de cuidados básicos",
    "Problemas de comunicación con responsable de unidad",
    "Otro"
  ];
/**
 * 
 - No sigue indicaciones médicas 
- No brinda los insumos necesarios 
- Falta de respeto hacia el personal
- No respeta horarios o reglamentos 
- Familiar de difícil manejo
*/

let toFamiliarOptions =[
  "No sigue indicaciones médicas",
  "No brinda los insumos necesarios",
  "Falta de respeto hacia el personal",
  "No respeta horarios o reglamentos",
  "Familiar de difícil manejo"
]

$:type, setOptiosByType();

function setOptiosByType(){
  if(type == 5){
    options = personalOptions;
  }else if(type == 1){
    options = familiarOptions;
  }else if(type == 4){
    options = toFamiliarOptions;
  }
}

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
        {#each options as item, i}
          <a
            class="dropdown-item"
            href="javascript:void(0);"
            on:click={function () {
              select(i);
            }}>{item}</a
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
