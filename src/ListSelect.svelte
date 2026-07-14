<script>
  import { onMount } from 'svelte'
  onMount(() => {
        jQuery(".dropdown-menu li a").click(function(){
          console.log(jQuery(this));
          jQuery(this).parents(".btn-group").find('.selection').text(jQuery(this).text());
          jQuery(this).parents(".btn-group").find('.selection').val(jQuery(this).text());
  
      });
  });
  
  export let inlist;
  
  export const options = [
      "Option 1", 
      "Option 2", 
      "Option 3"
  ];
  
  
  
  export let value = 0;
  
  
  function toggle() {
      inlist = !inlist;
    }
    function select(idx) {
      value = idx;
    }
  </script>
  
  <div class="col-sm-6">
    <div class="dropdown">
        <button on:click={toggle}>Toggle</button>
        {#if inlist==false}
        <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {#if value != null && typeof options[value] !== 'undefined'}{options[value]}{:else}Seleccionar{/if}<i class="mdi mdi-chevron-down"></i>
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            {#each options as op,i}
              <a class="dropdown-item" href="#" on:click={function(){select(i)}}>{op}</a>
            {/each}
            
        </div>
        {:else}
          {options[value]}
          
      
        {/if}
        
    </div>
  </div>