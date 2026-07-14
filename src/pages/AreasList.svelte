<script>
  import { onDestroy } from 'svelte';
  import { push } from 'svelte-spa-router';
  import TitleBar from '../TitleBar.svelte';
  import { areas } from '../controls/areas.js';

  let rows = [];
  const unsubscribe = areas.subscribe((value) => {
    rows = value;
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  function addArea() {
    push('/addareas');
  }

  function editArea(id) {
    push('/editareas/' + id);
  }

  function deleteArea(id) {
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Desea eliminar esta área o departamento',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#34c38f',
      cancelButtonColor: '#f46a6a',
      confirmButtonText: 'Sí, borrarla!'
    }).then((result) => {
      if (result.isConfirmed) {
        db.collection('areas').doc(id).delete();
      }
    });
  }
</script>

<div class="page-content">
  <TitleBar title="Áreas / Departamentos" base="Tickets" />
  <div class="row mb-3">
    <div class="col-md-12 text-right">
      <button class="btn btn-primary" on:click={addArea}>
        Agregar Área / Departamento
      </button>
    </div>
  </div>
  <div class="card">
    <div class="card-body">
      <h4 class="card-title">Administración de Áreas</h4>
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Valor</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as row}
              <tr>
                <td>{row.value}</td>
                <td>{row.name}</td>
                <td>{row.description || '-'}</td>
                <td>
                  <button class="btn btn-sm btn-light mr-2" on:click={() => editArea(row.id)}>
                    Editar
                  </button>
                  <button class="btn btn-sm btn-danger" on:click={() => deleteArea(row.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="4" class="text-center">No hay áreas registradas.</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
