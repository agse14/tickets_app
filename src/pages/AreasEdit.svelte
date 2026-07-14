<script>
  import { onMount } from 'svelte';
  import { pop } from 'svelte-spa-router';
  import TitleBar from '../TitleBar.svelte';

  export let params = {};
  let values = { name: '', value: 0, description: '' };
  let exists = false;
  let loading = true;
  let form;

  const tempId = params.bid;

  onMount(() => {
    form = document.getElementById('form');
    if (tempId) {
      db.collection('areas').doc(tempId).get().then((doc) => {
        if (doc.exists) {
          values = doc.data();
          values.value = values.value !== undefined ? Number(values.value) : 0;
          exists = true;
        }
        loading = false;
      });
    } else {
      loading = false;
    }
  });

  function cancel() {
    pop();
  }

  function saveArea() {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    loading = true;
    values.value = Number(values.value);

    if (tempId) {
      db.collection('areas').doc(tempId).update(values).then(() => {
        loading = false;
        pop();
      }).catch((error) => {
        loading = false;
        Swal.fire('Error', error.message, 'error');
      });
    } else {
      values.added = timenow;
      db.collection('areas').add(values).then(() => {
        loading = false;
        pop();
      }).catch((error) => {
        loading = false;
        Swal.fire('Error', error.message, 'error');
      });
    }
  }
</script>

<div class="page-content modal-body">
  <TitleBar title={exists ? 'Editar Área / Departamento' : 'Agregar Área / Departamento'} base="Tickets" />
  <form id="form">
    <div class="card">
      <div class="card-body">
        <div class="form-group row">
          <label for="name" class="col-md-4 col-form-label">Nombre</label>
          <div class="col-md-8">
            <input class="form-control" id="name" type="text" bind:value={values.name} required />
          </div>
        </div>
        <div class="form-group row">
          <label for="value" class="col-md-4 col-form-label">Valor numérico</label>
          <div class="col-md-8">
            <input class="form-control" id="value" type="number" bind:value={values.value} required />
            <small class="form-text text-muted">Este valor se usará en los tickets para almacenar la categoría del área.</small>
          </div>
        </div>
        <div class="form-group row">
          <label for="description" class="col-md-4 col-form-label">Descripción</label>
          <div class="col-md-8">
            <textarea class="form-control" id="description" rows="3" bind:value={values.description}></textarea>
          </div>
        </div>
        <div class="form-group row">
          <div class="col-md-8 offset-md-4">
            <button type="button" class="btn btn-primary" on:click={saveArea} disabled={loading}>
              Guardar
            </button>
            <button type="button" class="btn btn-secondary ml-2" on:click={cancel} disabled={loading}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
