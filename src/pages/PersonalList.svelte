<script>

import {link} from 'svelte-spa-router';
import TitleBar from "../TitleBar.svelte"    
import { onMount, onDestroy , tick} from 'svelte'
import {push, pop, replace} from 'svelte-spa-router'
import FilterName from '../controls/FilterName.svelte';
import {routes} from "../menu";

import TypeListSelect from "../controls/TypeListSelect.svelte"
import GenderListSelect from "../controls/GenderListSelect.svelte"
import ImageField from "../controls/ImageField.svelte";


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
    let personal = [];
    let datatable;
    let unsubscribe;

    let filterName = params.field;
    let filterValue = params.value;

    const hasAdd = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addpersonal") === 0;
        }).length > 0;
    const hasEdit = Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editpersonal/") === 0;
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
	
    let query = db.collection("personal");
    if(filterName != undefined && filterValue != undefined){
        console.log("filter : "+filterName+" == "+filterValue)
        query = query.where(filterName,"==",filterValue);
    }
    
    unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const temppersonal = doc.data();
            temppersonal.id = doc.id;
            tmp.push(temppersonal);
            
        });
        personal = tmp;
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
                    db.collection("personal").doc(id).delete();
                  //Swal.fire("Deleted!", "Your file has been deleted.", "success");
                }
            });
    
};

function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("personal").doc(id).update(update);
}

</script>

    

<div class="page-content">
    
    <TitleBar title="Personal" base="Inventario" />

<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title">Administración Personal</h4>
                 {#if filterName != undefined && filterValue != undefined}
                    <FilterName node={filterName} value={filterValue} />
                 {/if}
                 {#if hasAdd}
                <div class="row">
                    <div class="col"> </div>
                   
                    <div class="col-md-auto align-self-end">
                        <button on:click={function() { 
                            if(filterName != undefined && filterValue != undefined){
                                push('/addpersonal/'+filterName+'/'+filterValue);
                            }else{
                                push('/addpersonal');
                            }
                            
                        }} class="btn btn-primary waves-effect waves-light"><i class="bx bx-plus font-size-16 align-middle"></i> Agregar Personal</button>
                    </div>
                  </div>
                {/if}
                <table id="datatable-buttons" class="table table-striped table-bordered dt-responsive nowrap" style="border-collapse: collapse; border-spacing: 0; width: 100%;">
                    <thead>
                        <tr>
                            <th>Activo</th>
<th>Nombre</th>
<th>Apellidos</th>
<th>Email de contacto</th>
<th>Tipo</th>
<th>Expediente</th>  
                            <th>Acciones</th>                   
                        </tr>
                    </thead>

                    <tbody>
                        
                        {#each personal as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            
	<td><div class="custom-control custom-switch mb-2" dir="ltr">
	<input type="checkbox" class="custom-control-input" id="activeSwitch{row.id}" checked={row.active} on:change={e => { asyncChange(row.id,'active',e.target.checked); }} />
	<label class="custom-control-label" for="activeSwitch{row.id}"></label>
	</div></td><td><a href="/editpersonal/{row.id}" use:link>{row.name}</a></td>
<td>{row.lastname}</td>
<td>{row.email}</td>
<td><TypeListSelect value={row.type} inlist={true} /></td>
<td><a use:link={"/editrecords/"+row.id+"/partner/"+row.id} class="btn btn-light waves-effect">Ver Expediente</a></td>

                            <td>
                                {#if hasEdit}
                                <a href="/editpersonal/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
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