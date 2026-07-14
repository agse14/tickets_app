<script>
    import TitleBar from "../TitleBar.svelte";
    import { pop } from "svelte-spa-router";
    import { fbuser, permissions, profile } from "../stores.js";
    import { onDestroy, onMount } from "svelte";
    import SupervisionArea from "../controls/SupervisionArea.svelte";
    import Activities_table from "../controls/Activities_table.svelte";
  
    export let params = {};
    export let values = {};
    export let tempId = "";// "salle=fachada";//"salle-6";
    export let onBack = ()=> {
      pop();
    }
    let error = '';
    let loading;
    let scanning = false;
    let canScan = false;
    let abortController;

    console.log(params.bid)
    
    function cancel() {
      onBack();
    }

    const readTag = ({message}) => {
        const {records} = message;

        return records.map(record => {
            const {id, recordType, mediaType, encoding, data} = record;

            const decoder = encoding ? new TextDecoder(encoding) : new TextDecoder();

            switch(recordType) {
            case 'url':
            case 'text':
                console.log('data', decoder.decode(data));
                let text = decoder.decode(data);
                error = "TAG: "+ decoder.decode(data);
                //check if texts starts with patient:
                if (text.startsWith("supervision:")) {
                    let areaID = text.split(":")[1];
                    console.log('areaID', areaID);
                    tempId = areaID;
                }
                break;

            case 'mime':
                // showTagData(JSON.parse(decoder.decode(data)));
                error = "TAG: MIME "+ decoder.decode(data);
                let textMime = decoder.decode(data);
                error = "TAG: "+ decoder.decode(data);
                //check if texts starts with patient:
                if (textMime.startsWith("supervision:")) {
                    let areaID = textMime.split(":")[1];
                    console.log('areaID', areaID);
                    tempId = areaID;
                }
                break;
            }

            return ['url', 'text'].includes(recordType) ? decoder.decode(data) : JSON.parse(decoder.decode(data));
        });
};

onMount(async () => {
  try {
    if ("NDEFReader" in window){
        canScan = true;
    }
  }
  catch(e) {
    console.log('error scanning tag:', e);
    error = 'Error leyendo el sensor '+e;
  }
});

const scanTag = () => {
//   scanButton.disabled = true;
//   stopScanButton.disabled = false;

  return new Promise(async (resolve, reject) =>  {
    try {
      const reader = new NDEFReader();
      abortController = new AbortController();

      await reader.scan({signal: abortController.signal});
      scanning = true;

      reader.addEventListener('reading', e => resolve(readTag(e)));

      reader.addEventListener('readingerror', e => {
        console.log('error reading tag', e);
        error = 'Error leyendo la tarjeta';
        reject(e);
      });
    }
    catch(e) {
      console.log('error scanning tag:', e);
        error = 'Error leyendo la tarjeta '+e;
    //   scanButton.disabled = false;
    //   stopScanButton.disabled = true;
      scanning = false;

      reject(e);
    }
  });
};

const stopScan = () => {
  abortController.abort();

//   scanButton.disabled = false;
//   stopScanButton.disabled = true;
  scanning = false;
};

onDestroy(() => {
  if (abortController) {
    abortController.abort();
  }
});
  
</script>
{#if $permissions.admin || $permissions.cleaning}
  <div class="page-content modal-body">
    <!-- <TitleBar title="Tarjeta de Actividades Individual" base="Inventario" /> -->
    
        <div class="row">
            <div class="card" style="width:100%">
                <div class="card-body">
                    {#if canScan}
                        <h5 class="card-title mb-4">Escanear Sensor (Limpieza)</h5>
                    {:else}
                        <h5 class="card-title
                        mb-4">No se puede escanear los sensores</h5>
                    {/if}
                <!-- <button on:click={() => window.print() } class="btn btn-print waves-effect waves-light no-print"><i class="bx bx-printer font-size-16 align-middle mr-2"></i>Imprimir</button> -->
                {#if scanning}
                    <button on:click={stopScan} class="btn btn-danger waves-effect waves-light no-print">Detener</button>
                {:else}
                    <button on:click={scanTag} class="btn btn-primary waves-effect waves-light no-print">Escanear</button>
                {/if}
                <div class="error">{error}</div>
                <!-- <button
                type="button"
                on:click={cancel}
                class="btn btn-light waves-effect waves-light no-print"
                disabled={loading}>
                Cancelar</button> -->
                <div style="">
                    {#if tempId != undefined && tempId != ""}
                        {#key tempId}
                        <Activities_table uId="limpieza" view={1}/>
                        {/key}
                    {/if}
                </div>
            </div>
        </div>
    </div>
  </div>
{:else}

  <div class="page-content modal-body">
      <!-- <TitleBar title="Tarjeta de Actividades Individual" base="Inventario" /> -->
      
          <div class="row">
              <div class="card" style="width:100%">
                  <div class="card-body">
                      {#if canScan}
                          <h5 class="card-title mb-4">Escanear Sensor (Supervisión)</h5>
                      {:else}
                          <h5 class="card-title
                          mb-4">No se puede escanear los sensores</h5>
                      {/if}
                  <!-- <button on:click={() => window.print() } class="btn btn-print waves-effect waves-light no-print"><i class="bx bx-printer font-size-16 align-middle mr-2"></i>Imprimir</button> -->
                  {#if scanning}
                      <button on:click={stopScan} class="btn btn-danger waves-effect waves-light no-print">Detener</button>
                  {:else}
                      <button on:click={scanTag} class="btn btn-primary waves-effect waves-light no-print">Escanear</button>
                  {/if}
                  <div class="error">{error}</div>
                  <!-- <button
                  type="button"
                  on:click={cancel}
                  class="btn btn-light waves-effect waves-light no-print"
                  disabled={loading}>
                  Cancelar</button> -->
                  <div style="">
                      {#if tempId != undefined && tempId != ""}
                          {#key tempId}
                          <SupervisionArea sensorId={tempId} onBack={()=>{tempId=undefined; console.log("saved")}} buttons={false} />
                          {/key}
                      {/if}
                  </div>
              </div>
          </div>
      </div>
  </div>
{/if}
<style>
    .error {
        color: red;
    }
</style>
