<script>
  import { pop } from "svelte-spa-router";

  export let node = "";
  export let value = "";
  export let tag = "";
  export let header = true;
  export let back = true;
  var data ="";
  var collectionName = typeof node === 'string' ? node : String(node);
  var docId = typeof value === 'string' ? value : String(value);
  try {
    db.collection(collectionName).doc(docId).get().then(function(qs){
      console.log(qs);
      if(qs.exists){
          data = qs.data().name;
      }
    });
  } catch (error) {
    console.log(error);
  }
  
  function cancel(){
      pop();
  }
</script>
<div class="row"><div class="col-10">
  {#if header}
  <h2>{tag} {data}</h2>
  {:else}
  {tag} {data}
  {/if}
</div>
{#if back}
  <div class="col-2"><button
  on:click={cancel}
  class="btn btn-light waves-effect waves-light">
  Regresar</button>
  </div>
{/if}
</div>