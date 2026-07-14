<script>
  import { fbuser } from "../stores.js";
  import DocumentField from "./DocumentField.svelte";
  
  export let ticketId = "";
  export let attachments = {};
  export let canEdit = true;
  
  let loading = false;
  let newAttachmentValue = "";
  
  // Convert attachments object to array for easier display
  $: attachmentsList = Object.entries(attachments || {}).map(([key, value]) => ({
    id: key,
    ...value
  })).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  function removeAttachment(attachmentId) {
    if (!ticketId || !attachmentId) return;
    
    Swal.fire({
      title: "¿Está seguro?",
      text: "Desea eliminar este documento adjunto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#34c38f",
      cancelButtonColor: "#f46a6a",
      confirmButtonText: "Sí, eliminarlo!",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        loading = true;
        
        // Remove from Firebase Storage
        const attachment = attachments[attachmentId];
        if (attachment && attachment.downloadURL) {
          try {
            const fileRef = storage.refFromURL(attachment.downloadURL);
            fileRef.delete().catch((error) => {
              console.error('Error deleting file from storage:', error);
            });
          } catch (error) {
            console.error('Error getting file reference:', error);
          }
        }
        
        // Remove from Firestore
        db.collection("tickets").doc(ticketId).update({
          [`attachments.${attachmentId}`]: firebase.firestore.FieldValue.delete(),
          lastUpdated: new Date(),
          lastUpdatedBy: $fbuser.uid
        }).then(() => {
          loading = false;
          Swal.fire(
            "Eliminado!",
            "El documento ha sido eliminado.",
            "success"
          );
        }).catch((error) => {
          loading = false;
          console.error("Error removing attachment:", error);
          Swal.fire(
            "Error!",
            "Hubo un error al eliminar el documento.",
            "error"
          );
        });
      }
    });
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

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function timeFormated(timeStr) {
    if (timeStr == undefined || timeStr == "" || timeStr == null) {
      return "";
    }
    if (timeStr instanceof firebase.firestore.Timestamp) {
      return DateTime.fromJSDate(timeStr.toDate())
        .setLocale("es-mx")
        .toLocaleString(DateTime.DATETIME_SHORT);
    }
    if (timeStr instanceof Date) {
      return DateTime.fromJSDate(timeStr)
        .setLocale("es-mx")
        .toLocaleString(DateTime.DATETIME_SHORT);
    }
    return DateTime.fromISO(timeStr)
      .setLocale("es-mx")
      .toLocaleString(DateTime.DATETIME_SHORT);
  }
</script>

<div class="attachments-manager">
  {#if canEdit && ticketId}
    <div class="mb-3">
      <DocumentField 
        nodeId={ticketId} 
        baseId="newAttachment"
        maxSize={10}
        bind:value={newAttachmentValue}
      />
    </div>
  {/if}

  {#if attachmentsList.length > 0}
    <div class="attachments-list">
      <h5>Documentos Adjuntos ({attachmentsList.length})</h5>
      
      {#each attachmentsList as attachment}
        <div class="card mb-2">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-1">
                <i class="mdi {getFileIcon(attachment.fileName)} text-primary" style="font-size: 1.5rem;"></i>
              </div>
              <div class="col-6">
                <div class="file-info">
                  <strong>{attachment.originalName || attachment.fileName}</strong><br />
                  <small class="text-muted">
                    {formatFileSize(attachment.size || 0)} • 
                    Subido por {attachment.uploadedByName || 'Usuario'} • 
                    {timeFormated(attachment.uploadedAt)}
                  </small>
                </div>
              </div>
              <div class="col-5 text-right">
                <a 
                  href={attachment.downloadURL} 
                  target="_blank"
                  rel="noreferrer"
                  class="btn btn-sm btn-outline-primary me-2"
                  title="Ver/Descargar"
                >
                  <i class="mdi mdi-eye"></i> Ver
                </a>
                <a 
                  href={attachment.downloadURL} 
                  download={attachment.originalName || attachment.fileName}
                  class="btn btn-sm btn-outline-secondary me-2"
                  title="Descargar"
                >
                  <i class="mdi mdi-download"></i>
                </a>
                {#if canEdit}
                  <button 
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    on:click={() => removeAttachment(attachment.id)}
                    disabled={loading}
                    title="Eliminar"
                  >
                    <i class="mdi mdi-delete"></i>
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-muted">
      <i class="mdi mdi-paperclip"></i>
      No hay documentos adjuntos
    </div>
  {/if}
</div>

<style>
  .attachments-manager .file-info {
    font-size: 14px;
  }
  
  .attachments-list .card {
    border: 1px solid #e9ecef;
  }
  
  .attachments-list .card:hover {
    background-color: #f8f9fa;
  }
</style>