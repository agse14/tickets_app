<script>
  import { createEventDispatcher } from "svelte";
  import { fbuser } from "../stores.js";
  // import { db } from "../callable.js";

  export let showModal = false;
  export let activities = [];
  export let activityId = ""; // ID de la actividad principal

  const dispatch = createEventDispatcher();

  async function handleComplete(index, isCompleted) {
    try {
      // Verificar que tenemos un activityId válido
      if (!activityId) {
        console.error("Error: activityId está vacío");
        return;
      }

      // Obtener la subactividad por índice
      const subActivity = activities[index];
      if (!subActivity) {
        console.error("Error: No se encontró la subactividad en el índice", index);
        return;
      }

      // Actualizar el estado de completed en Firebase (cardActivities, no activities)
      const activityRef = db.collection("cardActivities").doc(activityId);

      // Marcar o desmarcar la subactividad con las propiedades correctas
      if (isCompleted) {
        // Marcar como completada
        subActivity.checkActivity = true;
        subActivity.checkDate = new Date();
        subActivity.checkby = $fbuser.uid;
        subActivity.checkName = $fbuser.displayName ?? '';
      } else {
        // Desmarcar
        subActivity.checkActivity = false;
        delete subActivity.checkDate;
        delete subActivity.checkby;
        delete subActivity.checkName;
      }

      // Forzar actualización reactiva del array
      activities = [...activities];

      // Actualizar en Firebase
      await activityRef.update({
        cleaningDetails: activities
      });

      // Verificar si TODAS las subactividades están completadas
      const allCompleted = activities.every((a) => a.checkActivity);

      if (allCompleted) {
        // Si todas están completas, marcar también la actividad principal como completada
        await activityRef.update({
          checkActivity: true,
          checkDate: new Date(),
          checkby: $fbuser.uid,
          checkName: $fbuser.displayName ?? ''
        });
        
        dispatch("allCompleted", activityId); // Enviar evento al padre
        closeModal(); // Cerrar el modal
      }
    } catch (error) {
      console.error("Error al actualizar la subactividad en Firebase:", error);
    }
  }

  function closeModal() {
    dispatch("close");
  }
</script>

{#if showModal}
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>Actividades de limpieza</h2>
      <ul>
        {#each activities as subActivity, index}
          <li class="activity-item {subActivity.checkActivity ? 'completed' : 'pending'}">
            <label class="activity-label">
              <input
                type="checkbox"
                checked={subActivity.checkActivity}
                on:change={(e) => handleComplete(index, e.target.checked)}
                class="activity-checkbox"
              />
              <span class="activity-text">{subActivity.description}</span>
              <span class="activity-status">
                {#if subActivity.checkActivity}
                  <div class="status-completed">
                    <span class="status-icon">✅ Completado</span>
                    {#if subActivity.checkDate}
                      <div class="completion-info">
                        <small class="completion-time">
                          {new Date(subActivity.checkDate.seconds ? subActivity.checkDate.seconds * 1000 : subActivity.checkDate).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                      </div>
                    {/if}
                  </div>
                {:else}
                  <span class="status-pending">⏳ Pendiente</span>
                {/if}
              </span>
            </label>
          </li>
        {/each}
      </ul>
        <button on:click={closeModal}>Cerrar</button>
      </div>
    </div>
  {/if}
  
  <style>
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 101;
    }
  
    .modal-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: left;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    h2 {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }
  
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
  
    .activity-item {
      margin: 12px 0;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .activity-item.completed {
      background-color: #f0f9ff;
      border-color: #22c55e;
    }

    .activity-item.pending {
      background-color: #fefefe;
      border-color: #fbbf24;
    }

    .activity-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      width: 100%;
    }

    .activity-checkbox {
      margin-right: 12px;
      transform: scale(1.2);
      cursor: pointer;
    }

    .activity-text {
      flex-grow: 1;
      font-weight: 500;
      color: #374151;
    }

    .activity-status {
      margin-left: 12px;
      font-size: 0.9em;
      font-weight: 600;
    }

    .status-completed {
      color: #22c55e;
    }

    .status-pending {
      color: #f59e0b;
    }

    .completion-info {
      margin-top: 4px;
    }

    .completion-time {
      display: block;
      color: #6b7280;
      font-size: 0.8em;
      font-style: italic;
    }

    button {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
      width: 100%;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: #2563eb;
    }
  </style>
  