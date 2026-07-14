<script>

  export let inlist;
  export const options = {"movil": "Movilicaci\u00f3n en cama", "company": "Acompa\u00f1amiento: Asistir citas Dr.", "confort": "Confort (Imagen, Limpieza, Cuidado)", "campany_day": "Compa\u00f1ia de d\u00eda", "gastro": "Sonda de gastostomia", "travel": "Viajar Fuera de la ciudad", "diet": "Suministrar dieta por sonda", "wash": "Lavar ropa en lavadora", "diaper": "Cambio de pa\u00f1al", "cook": "Cocina b\u00e1sica para px", "bath": "Ba\u00f1o en regadera", "hola": "Holador", "money": "Caja chica: compras, supermercado,etc.", "drive": "Manejar (Licencia de conducir)", "cleaning": "Aseo b\u00e1sico depto", "medicine": "Preparaci\u00f3n y administraci\u00f3n de medicamentos", "vitals": "Toma de signos vitales", "pet": "Pasear mascota", "company_night": "Compa\u00f1ia de noche"};
  let oId = 'Activities_aux';
  
  
  
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