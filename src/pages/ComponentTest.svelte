<script>
  import AutoComplete from "../AutoComplete.svelte";
  let list = [1,2,3,4,5];
</script>
<div class="page-content">
{#each list as l}
<AutoComplete  />
{/each}
</div>