<script>

export let inlist;
export const options = ["Activo", "Entregado", "Vencido"];



export let value = 0;
export let data = {};

let d = DateTime.fromISO(data.end).diffNow("days").values
let dif = d != undefined ? d.days:0;
//console.log(dif);
if(dif<0 && value == 0){
  value = 2;
}
  function select(idx) {
		value = idx;
	}
</script>
{#if !inlist}
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
    
    <span class="badge {value==1 ?'badge-soft-warning':value==2?'badge-soft-danger':'badge-soft-success'} font-size-12">{options[value]}</span>
{:else}
  -
{/if}