<script>
  export let data = {};

  let newActivity = { description: "" };

  function addActivity() {
    if (!data.activities) data.activities = [];
    if (newActivity.description.trim() !== "") {
      data.activities = [...data.activities, { ...newActivity }];
      newActivity.description = "";
    }
  }

  function deleteActivity(index) {
    data.activities = data.activities.filter((_, i) => i !== index);
  }
</script>

<div class="form-group row">
  <label for="activities" class="col-12 col-form-label">Actividades de limpieza</label>
</div>

<div class="form-group row">
  <div class="col-12">
    <div class="table-responsive">
      <table class="table table-sm mb-0">
        <thead class="thead-light">
          <tr>
            <th>#</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        {#if data.activities && data.activities.length > 0}
          <tbody>
            {#each data.activities as activity, index}
              <tr>
                <th scope="row">{index + 1}</th>
                <td>{activity.description}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn-outline-danger"
                    on:click={() => deleteActivity(index)}>
                    <i class="fas fa-times" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        {/if}
        <tr id="addActivityRow">
          <td>+</td>
          <td>
            <input class="form-control" type="text" bind:value={newActivity.description} placeholder="Nueva actividad" />
          </td>
          <td>
            <button
              type="button"
              class="btn btn-outline-success"
              on:click={addActivity}>
              <i class="fas fa-plus" />
            </button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</div>
