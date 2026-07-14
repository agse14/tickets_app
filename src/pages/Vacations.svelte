<script>
  import TitleBar from "../TitleBar.svelte";
  import ListSelect from "../ListSelect.svelte";
  import UsersSearchList from "../controls/UsersSearchList.svelte";
  import BranchesSearchList from "../controls/BranchesSearchList.svelte";
  import {link} from 'svelte-spa-router';
  import BranchSchedule from "./BranchSchedule.svelte";

  let worker = null;
  let vacStart = null;
  let vacEnd = null;
  let vacationlog = [];
  let workerName;
  $: worker, getVacations();

  
 

  function saveVacation() {

    // console.log(vacStart + " " + vacEnd + " " + worker)
    db.collection("vacations").add({
    users: worker,
    start: vacStart,
    end: vacEnd
    
})
.then(function() {
    console.log("Document successfully written!");
})
.catch(function(error) {
    console.error("Error writing document: ", error);
});
  }
  function getVacations(){
    const tmp = [];
    if(worker != null) {
      db.collection("vacations").get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
        const tempvacs = doc.data();
            tempvacs.id = doc.id;
            tmp.push(tempvacs);
            // console.log(tempvacs)
            
    });
    
    vacationlog = tmp;
    
});

    }
  }
  
  </script>

<div class="page-content">
    
  <TitleBar title="Vacaciones" base="RH" />
  
  
    <div class="row">
      <div class="col-12">
        <UsersSearchList bind:value={worker} />
      </div>

  </div>
    {#if worker != null}

        <div class="card">
        <div class="card-body">
      <table id="datatable-buttons" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
        <thead>
            <tr>
                

<th>Inicio vacaciones</th>
<th>Fin vacaciones</th>  
                                   
            </tr>
        </thead>

        <tbody>
          {#each vacationlog as row}
          {#if row.users == worker}
            <tr>
                
                <td>{row.start}</td>
                <td>{row.end}</td>

                
            </tr>
            {/if}
            {/each}
        </tbody>
    </table>
    </div>
        <div class="row">
            <div class="col-12">
              <div class="form-group row"><label for="" class="col-md-4 col-form-label">Fecha de Inicio</label> <div class="col-md-8"> <input class="form-control" type="date"  bind:value={vacStart}    required /> </div> </div>

              <div class="form-group row"><label for="" class="col-md-4 col-form-label">Fecha de término</label> <div class="col-md-8"> <input class="form-control" type="date"   bind:value={vacEnd} required /> </div> </div>
              
            </div>
            <button class="btn btn-primary waves-effect waves-light" on:click={() => {saveVacation()}}>
              Guardar Vacaciones
              </button>
        </div>
      </div>
    
    {:else}
    
        <p>Seleccione empleado</p>
        
    {/if}
   </div>
  
  


