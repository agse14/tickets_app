<script>
export let nodeId = "";
export let value = "";
export const type = "document";
export let baseId = "";
export let allowedTypes = "image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx";
export let maxSize = 10; // MB

const c = Math.PI*(90*2);
let percentage = 1*c;
let loading = false;
let file;

const onFile = event => {
    console.log(event.target);
    const file = event.target.files[0];
    if(file == undefined){
        return;
    }
    
    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
        Swal.fire({
            icon: 'error',
            title: 'Archivo muy grande',
            text: `El archivo debe ser menor a ${maxSize}MB. Tamaño actual: ${fileSizeInMB.toFixed(2)}MB`,
            confirmButtonText: 'Entendido'
        });
        event.target.value = '';
        return;
    }
    
    var ticketId = nodeId;
    if(ticketId == undefined || ticketId == ""){
        Swal.fire({
            icon: 'warning',
            title: 'Error',
            text: 'Debe guardar el ticket primero antes de subir archivos',
            confirmButtonText: 'Entendido'
        });
        return;
    }
    
    loading = true;
    
    // Generate unique filename with timestamp
    const timestamp = new Date().getTime();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const storageRef = storage.child(`tickets/${ticketId}/documents/${fileName}`);
    const task = storageRef.put(file);

    task.on('state_changed', (snapshot) => {
        percentage = (1 - (snapshot.bytesTransferred / snapshot.totalBytes)) * c;
    }, (error) => {
        console.error(error.message);
        loading = false;
        Swal.fire({
            icon: 'error',
            title: 'Error de carga',
            text: 'Error al subir el archivo: ' + error.message,
            confirmButtonText: 'Entendido'
        });
    }, () => {
        // Upload complete
        task.snapshot.ref.getDownloadURL().then(function(downloadURL) {
            console.log('File available at', downloadURL);
            value = downloadURL;
            loading = false;
            
            // Optionally save file info to ticket document
            if(ticketId) {
                const fileInfo = {
                    fileName: file.name,
                    originalName: file.name,
                    downloadURL: downloadURL,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date(),
                    uploadedBy: $fbuser ? $fbuser.uid : null,
                    uploadedByName: $fbuser ? ($fbuser.displayName || $fbuser.email) : null
                };
                
                // Add to ticket's attachments array
                if (db && $fbuser) {
                    db.collection("tickets").doc(ticketId).update({
                        [`attachments.${timestamp}`]: fileInfo,
                        lastUpdated: new Date(),
                        lastUpdatedBy: $fbuser.uid
                    });
                }
            }
        });
    });
};

function removeFile() {
    if(value && nodeId) {
        // Remove from storage
        const fileRef = storage.refFromURL(value);
        fileRef.delete().then(() => {
            console.log('File deleted successfully');
        }).catch((error) => {
            console.error('Error deleting file:', error);
        });
    }
    value = "";
}

function getFileIcon(fileName) {
    if (!fileName) return "mdi-file-outline";
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch(extension) {
        case 'pdf': return "mdi-file-pdf-box";
        case 'doc':
        case 'docx': return "mdi-file-word-box";
        case 'xls':
        case 'xlsx': return "mdi-file-excel-box";
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return "mdi-file-image-box";
        case 'txt': return "mdi-file-document-outline";
        case 'csv': return "mdi-file-delimited-outline";
        default: return "mdi-file-outline";
    }
}

function getFileName(url) {
    if (!url) return "";
    try {
        const urlParts = url.split('/');
        const fileNameWithQuery = urlParts[urlParts.length - 1];
        const fileName = fileNameWithQuery.split('?')[0];
        // Remove timestamp prefix if present
        return fileName.replace(/^\d+_/, '');
    } catch(e) {
        return "Archivo";
    }
}

// Import fbuser for file operations
import { fbuser } from "../stores.js";
</script>

<style>
.selector{
  border:solid 2px #eaeaea;
  padding: 15px;
  border-radius:10px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.selector:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}
.container{
  position:relative;
}
.mdi{
  font-size:25px;
}
#progress {
  position:absolute;
  left:0; top:0; width:100%; height:100%
}
#progress circle {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1s linear;
  stroke: #666;
  stroke-width: 1em;
}
#progress #bar {
  stroke: #FF9F1E;
}
.file-preview {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
  background-color: #f8f9fa;
}
.file-info {
  font-size: 14px;
}
.remove-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: #dc3545;
  color: white;
  border: none;
  font-size: 12px;
  cursor: pointer;
}
</style>

<div class="text-center">
    <label class="" for="customFile{baseId}">
        {#if value == "" || value == undefined}
            <div class="row selector">
                <div class="col-4">
                    <div class="avatar-md img-thumbnail rounded-circle">
                        <span class="avatar-title rounded-circle container">
                            {#if loading}
                                <svg id="progress" viewPort="0 0 100 100" preserveAspectRatio="none" viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <circle r="90" cx="100" cy="100" fill="transparent" stroke-dasharray="565.48" stroke-dashoffset="0"></circle>
                                    <circle id="bar" r="90" cx="100" cy="100" fill="transparent" stroke-dasharray="565.48" style="stroke-dashoffset:{percentage}px"></circle>
                                </svg>
                            {:else}
                                <i class="mdi mdi-file-plus-outline"></i>
                            {/if}
                        </span>
                    </div>
                </div>
                <div class="col-8 d-flex align-items-center">
                    <div>
                        <i class="mdi mdi-arrow-up-bold-box-outline"></i><br />
                        <strong>Seleccionar Documento</strong><br />
                        <small class="text-muted">
                            Máximo {maxSize}MB<br />
                            PDF, Word, Excel, Imágenes, TXT
                        </small>
                    </div>
                </div>
            </div>
        {:else}
            <div class="file-preview position-relative">
                <button 
                    type="button" 
                    class="remove-btn"
                    on:click|preventDefault={removeFile}
                    title="Eliminar archivo"
                >
                    ×
                </button>
                <div class="row align-items-center">
                    <div class="col-2">
                        <i class="mdi {getFileIcon(getFileName(value))} text-primary" style="font-size: 2rem;"></i>
                    </div>
                    <div class="col-7 text-left">
                        <div class="file-info">
                            <strong>{getFileName(value)}</strong><br />
                            <small class="text-muted">Documento subido</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <a 
                            href={value} 
                            target="_blank"
                            rel="noreferrer"
                            class="btn btn-sm btn-outline-primary"
                            on:click|stopPropagation
                        >
                        >
                            <i class="mdi mdi-eye"></i>
                        </a>
                    </div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="mdi mdi-arrow-up-bold-box-outline"></i>
                        Clic para cambiar archivo
                    </small>
                </div>
            </div>
        {/if} 
    </label>
    
    <div class="d-none">
        <div class="custom-file">
            <input 
                type="file" 
                on:input={onFile}  
                class="custom-file-input" 
                id="customFile{baseId}" 
                disabled={loading}
                accept={allowedTypes}
            />
        </div>
    </div>
</div>