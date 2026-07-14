<script>

  export let inlist;
  export const options = {"cirrosis": "Cirrosis Hep\u00e1tica", "diabetes": "Diabetes", "paralisis": "Par\u00e1lisis cerebral", "cancer": "Cancer", "parkinson": "Parkinson", "fibromalgia": "Fibromalgia", "alzheimer": "Alzheimer", "attack": "Infarto", "down": "Sindrome down", "epoc": "Epoc", "depresion": "Depresi\u00f3n y enfermedades mentales", "asma": "Asma", "obesity": "Obesidad", "vih": "VIH", "ms": "Esclerosis Multiple"};
  let oId = 'Activities_general';
  
  
  
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