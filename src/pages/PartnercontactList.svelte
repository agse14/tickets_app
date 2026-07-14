<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import {routes} from "../menu";



import { quintOut } from 'svelte/easing';
import { crossfade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	const [send, receive] = crossfade({
		duration: d => Math.sqrt(d * 200),

		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
    });
    

    export let params = {};
    let partnercontact = [];
    let datatable;
    let unsubscribe;

    let filterName = params.field;
    let filterValue = params.value;

    const hasAdd = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addpartnercontact") === 0;
        }).length > 0;
    const hasEdit = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editpartnercontact/") === 0;
        }).length > 0;
    
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
	
    let query = db.collection("partnercontact");
    if(filterName != undefined && filterValue != undefined){
        console.log("filter : "+filterName+" == "+filterValue)
        query = query.where(filterName,"==",filterValue);
    }
    
    unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const temppartnercontact = doc.data();
            temppartnercontact.id = doc.id;
            tmp.push(temppartnercontact);
            
        });
        partnercontact = tmp;
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
                    db.collection("partnercontact").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};

function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("partnercontact").doc(id).update(update);
}

</script>

    

<div class="page-content">
    
    <TitleBar title="Comunicación" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title">Administración Comunicación</h4>
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={filterName} value={filterValue} />
                 {/if}
                 {#if hasAdd}
                <div class="row">
                    <div class="col"> </div>
                   
                    <div class="col-md-auto align-self-end">
                        <button on:click={function() { 
                            if(filterName != undefined && filterValue != undefined){
                                push('/addpartnercontact/'+filterName+'/'+filterValue);
                            }else{
                                push('/addpartnercontact');
                            }
                            
                        }} class="btn btn-primary waves-effect waves-light"><i class="bx bx-plus font-size-16 align-middle"></i> Agregar Contacto Enfermeros</button>
                    </div>
                  </div>
                {/if}
                <table id="datatable-buttons" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th>Socio</th>
<th>Mensaje</th>
  
                            <th>Acciones</th>                   
                        </tr>
                    </thead>

                    <tbody>
                        
                        {#each partnercontact as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            <td><a href="/editpartnercontact/{row.id}" use:link>{row.name}</a></td>
<td>{row.message}</td>

                            <td>
                                {#if hasEdit}
                                <a href="/editpartnercontact/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                                {/if}
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