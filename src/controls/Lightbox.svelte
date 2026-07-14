<script lang="ts">
	export let src = '';
	export let alt = '';
    export let cell:any|undefined = undefined;
	export let view: 'link' | 'img' = 'link';
	let showModal = false;
	console.log("cell",cell);
</script>

{#if src != '' || cell != undefined}
	{#if view == 'img'}
		Imagen
	{:else}
		<a
			href={src}
			class="text-primary hover:underline"
			on:click|preventDefault={() => {
				showModal = true;
			}}>Ver</a
		>
	{/if}

	{#if showModal}
		<!-- The Modal -->
		<div
			id="modal"
			class="fixed top-0 left-0 z-80 w-screen h-screen bg-black/70 flex justify-center items-center"
		>
			<!-- The close button -->
			<button
				type="button"
				class="fixed z-90 top-6 right-8 text-white text-5xl font-bold"
				on:click={() => {
					showModal = false;
				}}>&times;</button
			>

			<!-- A big image will be displayed here -->
			<img id="modal-img" class="max-w-[800px] max-h-[600px] object-cover" {src} {alt} />
		</div>
	{/if}
{/if}
