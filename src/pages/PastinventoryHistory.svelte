<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import {branches} from "../controls/branches.js"
import BranchesSearchList from "../controls/BranchesSearchList.svelte"
import {products} from "../controls/products.js"
import ProductsSearchList from "../controls/ProductsSearchList.svelte"


    export let params = {};
    let pastinventory = [];
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
        datatable = jQuery('#datatable-buttons').responsiveTable({
        addDisplayAllBtn: 'btn btn-secondary'
    });
    }
	
    let query = db.collection("pastinventory");
    if(filterName != undefined && filterValue != undefined){
        console.log("filter : "+filterName+" == "+filterValue)
        query = query.where(filterName,"==",filterValue);
    }
    //.orderBy('added','desc')
    unsubscribe = query.onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const temppastinventory = doc.data();
            temppastinventory.id = doc.id;
            tmp.push(temppastinventory);
            
        });
        pastinventory = tmp;
        await tick();
        if(datatable == undefined){
            
            loadData();
        }else{
            //datatable.clear();
        }

        //datatable.rows('dom').invalidate();
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
                    db.collection("pastinventory").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};

function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("pastinventory").doc(id).update(update);
}

</script>

    

<div class="page-content">
    
    <TitleBar title="Historial" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title">Administración Historial</h4>
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={filterName} value={filterValue} />
                 {/if}
                
                 <div class="table-rep-plugin">
                    <div class="table-responsive mb-0" data-pattern="priority-columns">
                        <table id="tech-companies-1" class="table table-striped">
                    <thead>
                        <tr>
                            <th>Producto</th>
<th>Cantidad</th>
  
                            <th>Acciones</th>                   
                        </tr>
                    </thead>

                    <tbody>
                        
                        {#each pastinventory as row}
                        <tr>
                            <td><ProductsSearchList value={row.products} inlist={true} /></td>
<td>{row.quantity}</td>

                            <td><a href="/editpastinventory/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button></td>
                        </tr>
                        {/each}
                       
                    </tbody>
                </table>
            </div>

        </div>
                
            </div>
        </div>
    </div>
    <!-- end col -->
</div>
<!-- end row -->
</div>