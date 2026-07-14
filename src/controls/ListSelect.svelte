<script>
	export let inlist;
	export let options = [];

	export let view = "default";
	export let value = 0;
	export let prefix = "";
	export let disabled = false;

	function select(idx) {
		value = idx;
	}
</script>

{#if view == "check"}
	{#each options as op, i}
		<div class="form-check mb-2">
			<input
				class="form-check-input"
				type="radio"
				bind:group={value}
				id="{prefix}radio{i}"
				value={i}
				disabled={disabled}
			/>
			<label class="form-check-label" for="{prefix}radio{i}">
				{op}
			</label>
		</div>
	{/each}
	<hr />
{:else if !inlist}
	<div class="">
		<div class="dropdown">
			<button
				class="btn btn-secondary dropdown-toggle"
				type="button"
				id="dropdownMenuButton"
				data-toggle="dropdown"
				aria-haspopup="true"
				aria-expanded="false"
				disabled={disabled}
			>
				{#if value != null && typeof options[value] !== "undefined"}{options[
						value
					]}{:else}Seleccionar{/if}<i class="mdi mdi-chevron-down" />
			</button>
			<div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
				{#each options as op, i}
					<a
						class="dropdown-item"
						href="javascript:void(0);"
						on:click={function () {
							if (!disabled) select(i);
						}}>{op}</a
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
