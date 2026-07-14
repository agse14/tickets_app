<script>

  export let inlist;
  export const options = {"feed": "Alimentaci\u00f3n por sonda", "clean": "Aseo b\u00e1sico del ba\u00f1o y cuarto", "confort": "Confort  (Imagen, Limpieza, Cuidado)", "crane": "Manejo de gr\u00faa y arn\u00e9s", "vitals": "Medici\u00f3n de signos vitales", "presion": "Medir presi\u00f3n arterial", "move": "Movilzaci\u00f3n", "shots": "Aplicaci\u00f3n de inyecciones", "activity": "Acompa\u00f1ar a actividad", "medicine": "Preparaci\u00f3n y administraci\u00f3n de medicamentos", "diaper": "Cambio de pa\u00f1al", "heal": "Curaciones b\u00e1sicas: yagas de presi\u00f3n, heridas quirurgicas", "temp": "Medir temperatura", "gastric": "Administraci\u00f3n e higiene de sonda g\u00e1strica", "cook": "Cocina b\u00e1sica para paciente", "insuline": "Aplicaci\u00f3n Insulina", "sugar": "Test de Azucar", "doc_visit": "Acompa\u00f1ar al Doctor", "oxigen": "Manejo de concentrador de ox\u00edgeno", "bath": "Ba\u00f1o en cama o regadera", "pulse": "Medir pulso"};
  let oId = 'Activities_basic';
  
  
  
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
      {#each Object.entries(options)  as [op,i]}
        <div class="custom-control custom-checkbox mb-2 col-md-6">
          <input type="checkbox" class="custom-control-input"  bind:group={selection} id="{oId}{op}" name="{oId}{op}" value={op} checked={value != undefined && value[op]} />
          <label class="custom-control-label" for="{oId}{op}">{i}</label>
        </div>
      {/each}
      <div class="col-12"><hr /></div>
    </div>
  </div>
  {:else if value != null && typeof options[value] !== 'undefined'}
          {options[value]}
        {:else}
          -
        {/if}