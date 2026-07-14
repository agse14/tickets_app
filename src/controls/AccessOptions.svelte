<script>
  export let inlist;
  export const options = {
    // admin_hours: "Administrar Roles de trabajo",
    // admin_inventory: "Administrar Inventario",
    // supervision: "Crear reportes de supervision",
    // accounting: "Contabilidad",
    // supervision_tags: "Rondas de Revisiones (tags)",
    // view_hours: "Ver Asignaciones en Calendario",
    // hr: "Recursos Humanos",
    // oxigenica: "Administrar Concentradores",
    // patients: "Ver todos los residentes",
    // admin_medi: "Administrar App Medi",
    // self_hr: "Capturar perfil propio de RH",
    // asign_inventory: "Capturar Inventario semanal",
    // social_branch: "Actualizaciones sociales estancias",
    // admin_branch: "Administrar Estancia",
    // view_payments: "Ver Todos los Pagos",
    // nominas: "Nominas",
    // operations: "Operaciones",
    // maintenance: "Mantenimiento",
    // maintenance_chief: "Jefe de Mantenimiento",
    // collect_payments: "Cobrar Pagos",
    // cleaning: "Limpieza",
    admin: "Administrador General",
    tickets: "Soporte y Tickets",
  };
  let oId = "Access";

  export let value = {};

  let selection = [];

  $: selection, select();
  function select() {
    var tmpv = {};
    for (let s = 0; s < selection.length; s++) {
      tmpv[selection[s]] = true;
    }
    value = tmpv;
    console.log(value);
  }
</script>

{#if !inlist}
  <div class="col-12">
    <div class="row">
      {#each Object.entries(options) as [op, i]}
        <div class="custom-control custom-checkbox mb-2 col-md-6">
          <input
            type="checkbox"
            class="custom-control-input"
            bind:group={selection}
            id="{oId}{op}"
            name="{oId}{op}"
            value={op}
            checked={value != undefined && value[op]}
          />
          <label class="custom-control-label" for="{oId}{op}">{i}</label>
        </div>
      {/each}
      <div class="col-12"><hr /></div>
    </div>
  </div>
{:else if value != null && typeof options[value] !== "undefined"}
  {options[value]}
{:else}
  -
{/if}
