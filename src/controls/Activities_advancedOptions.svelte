<script>

  export let inlist;
  export const options = {"traquea": "Traqueostim\u00eda, aspiraci\u00f3n de secreciones", "foley": "Manejo de sonda Foley vaso-gastrica", "catheter": "Manejo de catheter central", "diet": "Preparaci\u00f3n de dieta blanda. Gastrostom\u00eda", "feed": "Manejo de bomba de alimentaci\u00f3n", "canal": "Canalizaci\u00f3n", "liquids": "Manejo de perfil de liquidos. (Cuantificaci\u00f3n y control)", "catheter_per": "Manejo de catheter periferico", "cardio_advanced": "Reanimaci\u00f3n cardiopulmonar avanzada", "vitals": "Manejo de monitor de signos vitales", "ventilator": "Manejo de ventilador artificial", "dialisis": "Manejo de di\u00e1lisis manual", "premature": "Ni\u00f1o prematuro", "portacad": "Manejo de catheter portacad", "infusion": "Manejo de bomba de infusi\u00f3n", "foot": "Curaci\u00f3n de pie diab\u00e9tico", "cardio": "Reanimaci\u00f3n cardiopulmonar b\u00e1sica", "bronquial": "Realizaci\u00f3n de lavado bronquial", "rcp": "RCP pedi\u00e1trico", "oximeter": "Manejo oximetro"};
  let oId = 'Activities_advanced';
  
  
  
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