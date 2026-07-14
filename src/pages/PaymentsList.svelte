<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import ImageField from "../controls/ImageField.svelte";


    export let params = {};
    let payments = [];
    let datatable;
    let unsubscribe;

    let filterName = params.field;
    let filterValue = params.value;
    
    onMount(() => {

    });
    onDestroy(() => {
		if(unsubscribe != null && unsubscribe != undefined){
            unsubscribe();
        }
	});
    function loadData(){
        datatable = jQuery('#datatable-buttons').DataTable({
                lengthChange: false,
                buttons: ['copy', 'excel', 'pdf']
            });

            datatable.buttons().container()
                .appendTo('#datatable-buttons_wrapper .col-md-6:eq(0)');
    }
	
    let query = db.collection("payments");
    if(filterName != undefined && filterValue != undefined){
        console.log("filter : "+filterName+" == "+filterValue)
        query = query.where(filterName,"==",filterValue);
    }
    
    unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const temppayments = doc.data();
            temppayments.id = doc.id;
            tmp.push(temppayments);
            
        });
        payments = tmp;
        await tick();
        if(datatable == undefined){
            
            loadData();
        }else{
            datatable.clear();
        }

        datatable.rows('dom').invalidate();
    });



function deleteDoc(id) {
    Swal.fire({
                title: "¿Esta seguro?",
                text: "Desea eliminar este registro",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
                confirmButtonText: "Si, borrarlo!"
              }).then(function (result) {
                if (result.value) {
                    db.collection("payments").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};

function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("payments").doc(id).update(update);
}

</script>

    

<div class="page-content">
    
    <TitleBar title="Pagos" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title">Administración Pagos</h4>
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={filterName} value={filterValue} />
                 {/if}
                <div class="row">
                    <div class="col"> </div>
                   
                    <div class="col-md-auto align-self-end">
                        <button on:click={function() { 
                            if(filterName != undefined && filterValue != undefined){
                                push('/addpayments/'+filterName+'/'+filterValue);
                            }else{
                                push('/addpayments');
                            }
                            
                        }} class="btn btn-primary waves-effect waves-light"><i class="bx bx-plus font-size-16 align-middle"></i> Agregar Pago de servicio</button>
                    </div>
                  </div>
                
                <table id="datatable-buttons" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th>Servicio</th>
<th>Cliente</th>
<th>Email</th>
<th>Transacción</th>
<th>Pagado</th>
  
                            <th>Acciones</th>                   
                        </tr>
                    </thead>

                    <tbody>
                        
                        {#each payments as row}
                        <tr>
                            <td>{row.folio}</td>
<td>{row.userName}</td>
<td>{row.userEmail}</td>
<td>{row.id}</td>
<td>$ {row.amount}</td>

                            <td><a href="/editpayments/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button></td>
                        </tr>
                        {/each}
                       
                    </tbody>
                </table>
                
            </div>
        </div>
    </div>
    <!-- end col -->
</div>
<!-- end row -->
</div>