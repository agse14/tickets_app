<script>
    import { onMount } from "svelte";
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { permissions } from "../stores.js";

    let file = null;
    let loading = false;
    let uploadProgress = 0;
    let documents = [];

    async function handleFileChange(event) {
        file = event.target.files[0];
    }

    async function uploadFile() {
        if (!file) return;
        loading = true;
        try {
            // 1. Sube el archivo a Storage
            const storageRef = storage.child("documents/" + Date.now() + "_" + file.name);
            await storageRef.put(file);
            const url = await storageRef.getDownloadURL();

            // 2. Guarda los metadatos en Firestore
            await db.collection("documents").add({
                name: file.name,
                url,
                added: firebase.firestore.FieldValue.serverTimestamp()
            });

            file = null;
            await loadDocuments();
            alert("Archivo subido correctamente.");
        } catch (e) {
            alert("Error al subir archivo: " + e.message);
        }
        loading = false;
    }

    async function loadDocuments() {
        documents = [];
        const snapshot = await db.collection("documents")
            .orderBy("added", "desc")
            .get();
        if (snapshot.empty) {
            console.log("No hay documentos cargados.");
            return;
        }
        console.log("Documentos cargados:", snapshot.docs.length);
        // Map the documents to include their IDs and data 
        documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async function deleteDocument(doc) {
        if (!confirm(`¿Seguro que deseas borrar el documento "${doc.name}"?`)) return;
        try {
            // 1. Borra de Storage
            // Extrae el path relativo del archivo en Storage
            const url = new URL(doc.url);
            // El path después de "/o/" y antes de "?"
            const path = decodeURIComponent(url.pathname.split("/o/")[1]);
            await storage.child(path).delete();

            // 2. Borra de Firestore
            await db.collection("documents").doc(doc.id).delete();

            await loadDocuments();
            alert("Documento borrado correctamente.");
        } catch (e) {
            alert("Error al borrar documento: " + e.message);
        }
    }

    onMount(loadDocuments);
</script>

<div class="page-content">
    <TitleBar title="Inicio" base="Dashboard" />
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body">
                    <div class="container mt-4">
                        {#if $permissions.admin || $permissions.operations}
                            
                                <h3>Gestión de Documentos PDF</h3>
                                <br/>
                                <div class="mb-3">
                                    <input type="file" accept="application/pdf" on:change={handleFileChange} disabled={loading} />
                                    <button class="btn btn-primary ml-2" on:click={uploadFile} disabled={loading || !file}>
                                        {loading ? "Subiendo..." : "Subir PDF"}
                                    </button>
                                    {#if loading}
                                        <div class="progress mt-2" style="height: 8px;">
                                            <div class="progress-bar" role="progressbar" style="width: {uploadProgress}%"></div>
                                        </div>
                                    {/if}
                                </div>
                            
                        {/if}
                        
                        <div class="form-group row">
                            <h5>Documentos para consulta</h5>
                            
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Fecha de carga</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each documents as doc}
                                        <tr>
                                            <td>{doc.name}</td>
                                            <td>{doc.added ? new Date(doc.added.seconds * 1000).toLocaleString() : "-"}</td>
                                            <td>
                                                {#if $permissions.admin_hours || $permissions.admin}
                                                    <a class="btn btn-info btn-sm" href={doc.url} target="_blank">Ver PDF</a>
                                                {/if}
                                                {#if $permissions.admin || $permissions.operations}
                                                    <button class="btn btn-danger btn-sm ml-2" on:click={() => deleteDocument(doc)}>
                                                        Borrar
                                                    </button>
                                                {/if}
                                                {#if !($permissions.admin || $permissions.admin_hours || $permissions.operations)}
                                                    Necesita permisos para ver o borrar documentos.
                                                {/if}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- <style>
    .mb-3 {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
</style> -->