<script>

  export let inlist;
  export const options = {};
  let oId = 'Head_buttons_foot';
  
  
  
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