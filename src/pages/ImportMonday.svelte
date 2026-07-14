<script>
    import { onMount } from 'svelte';
    import TitleBar from '../TitleBar.svelte';

    // Firebase is available globally as 'db' from index.html

    let jsonInput = '';
    let message = '';
    let loading = false;

    async function importConfig() {
        if (!jsonInput.trim()) {
            message = 'Por favor, pega el JSON de configuración.';
            return;
        }

        try {
            const config = JSON.parse(jsonInput);
            loading = true;
            message = 'Importando configuración...';

            // Validar estructura básica
            if (!config.accessToken || !config.boardMapping || !config.boards) {
                throw new Error('JSON inválido: faltan campos requeridos (accessToken, boardMapping, boards)');
            }

            // Actualizar el documento en Firestore
            await db.collection('config').doc('monday').set(config);

            message = 'Configuración importada exitosamente.';
            jsonInput = ''; // Limpiar el input
        } catch (error) {
            console.error('Error importando configuración:', error);
            message = `Error: ${error.message}`;
        } finally {
            loading = false;
        }
    }

    let currentConfig = null;

    async function loadCurrentConfig() {
        try {
            const doc = await db.collection('config').doc('monday').get();
            if (doc.exists) {
                currentConfig = doc.data();
                jsonInput = JSON.stringify(currentConfig, null, 2);
            } else {
                message = 'No hay configuración actual. Pega una nueva.';
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
            message = 'Error cargando configuración actual.';
        }
    }

    onMount(() => {
        loadCurrentConfig();
    });
</script>

<div class="container-fluid">
    <TitleBar title="Importación Configuración Monday" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Importar Configuración de Monday.com</h4>
                    <p class="card-text">
                        Pega el JSON completo de configuración de Monday.com aquí. Esto actualizará el documento <code>config/monday</code> en Firestore.
                        {#if currentConfig}
                            <br><small class="text-muted">La configuración actual se cargó automáticamente. Edítala si es necesario.</small>
                        {/if}
                    </p>

                    {#if message}
                        <div class="alert alert-info">{message}</div>
                    {/if}

                    <div class="form-group">
                        <label for="jsonInput">JSON de Configuración:</label>
                        <textarea
                            id="jsonInput"
                            class="form-control"
                            rows="20"
                            bind:value={jsonInput}
                            placeholder={`Configuración actualizada para Proyectos (área 8) con board 18390686328:

{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjYzNDM1NDUwNSwiYWFpIjoxMSwidWlkIjo0NTk5ODc0MiwiaWFkIjoiMjAyNi0wMy0xN1QxODo0Nzo1MC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTY2ODk3MzcsInJnbiI6InVzZTEifQ.-G6LvVqXgIm2vK0UwFJqS3Ztb9g-9Q5NtTuvu439cuo",
  "boardMapping": {
    "0": "6957252119",
    "1": "6957252119",
    "2": "6957252119",
    "3": "6957252119",
    "4": "6957252119",
    "5": "6957252119",
    "6": "6957252119",
    "7": "6957252119",
    "8": "18390686328"
  },
  "boards": {
    "6957252119": {
      "groupMapping": {
        "0": "grupo_nuevo24260__1",
        "1": "group_mkrvyv4z",
        "2": "group_mkrvet92",
        "3": "grupo_nuevo_mkky8fgg",
        "4": "grupo_nuevo31593__1",
        "5": "grupo_nuevo75216__1",
        "6": "group_mkrhchzy",
        "7": "group_mkxcsw9x"
      },
      "statusColumnId": "estado_mkmmt37k",
      "peopleColumnId": "person",
      "hoursColumnId": "n_meros_mkmm8ewd",
      "dateColumnId": "date4",
      "priorityColumnId": null,
      "statusIndex": { "0": 0, "1": 0, "2": 1, "3": 1, "4": 2 }
    },
    "18390686328": {
      "groupMapping": {
        "8": "group_mm0bqv7g"
      },
      "statusColumnId": "status",
      "peopleColumnId": "person",
      "hoursColumnId": null,
      "dateColumnId": "date4",
      "priorityColumnId": null,
      "statusIndex": { "0": 0, "1": 1, "2": 2, "3": 12, "4": 14 }
    }
  }
}`}
                        ></textarea>
                    </div>

                    <button
                        class="btn btn-secondary mr-2"
                        on:click={loadCurrentConfig}
                    >
                        Recargar Configuración Actual
                    </button>

                    <button
                        class="btn btn-primary"
                        on:click={importConfig}
                        disabled={loading}
                    >
                        {#if loading}
                            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Importando...
                        {:else}
                            Importar Configuración
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    textarea {
        font-family: monospace;
        font-size: 0.9em;
    }
</style>