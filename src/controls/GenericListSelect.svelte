<script>
  export let inlist;
  export let options = [];
  export let value = 0;
  export let classList = "";

  function select(idx) {
    value = idx;
  }
</script>

{#if !inlist}
  <div class={classList}>
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
        {#each options as op, i}
          <button
          type="button"
            class="dropdown-item"
            on:click={function () {
              select(i);
            }}>{op}</button
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
