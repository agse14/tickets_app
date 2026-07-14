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
    import {profile, permissions} from "../stores.js";
    
    
        export let params = {};
        let pastinventory = [];
        let datatable;
        let unsubscribe;
        let start = DateTime.local().minus({days:3}).startOf('day');//DateTime.local().startOf('week');//;.plus({ days: 1 });
        let end = DateTime.local();//DateTime.local().endOf('week');
        let loading = false;
        let notes = "";

        let filterName = params.field;
        let filterValue = params.value;

        let values = {notes:""};
        let maxQ ={};
        var cdate = DateTime.local()
            .setLocale("es-mx");
            // AQUI se genera el id del dia, la libreria es esta
            //https://moment.github.io/luxon/docs/index.html
        let dayId = cdate.toISODate();
        let dayName = cdate.toLocaleString(DateTime.DATE_FULL);
        let pastId = "";
        let profile_value;
       
        
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
            var defaultOptions = {
            };
            jQuery('[data-toggle="touchspin"]').each(function (idx, obj) {
                //var objOptions = jQuery.extend({step:0.5}, defaultOptions, jQuery(obj).data());
                //weight
                //console.log(obj);
                if(obj.classList.contains('weight')){
                    jQuery(obj).TouchSpin({step:0.5, min:0,decimals: 1});
                }else{
                    jQuery(obj).TouchSpin({step:1, min:0,decimals: 0});
                }
                //objOptions);
            });
            jQuery('[data-toggle="touchspin"]').on("change", function(data){
                const chInput = jQuery(data.target);
                const val = parseFloat(chInput.val());
                //console.log("change",chInput.data('name'));
                if(maxQ[chInput.data('name')] != undefined && maxQ[chInput.data('name')] !=0 && val > maxQ[chInput.data('name')]){
                    chInput.val(maxQ[chInput.data('name')]);
                    values[chInput.data('name')] = maxQ[chInput.data('name')];
                    return;
                    
                }
                values[chInput.data('name')] = val;
                
            });
        
        }
        
        if(filterName != undefined && filterValue != undefined){
            
            profileLoaded();
        }else{
            const unsubscribe = profile.subscribe(value => {
                    profile_value = value;
                    if(profile_value != null && profile_value != undefined){
                        profileLoaded();
                    }
                });
        }
    function profileLoaded(){

        let query = db.collection("inventory");
        if(filterName != undefined && filterValue != undefined){
            
            query = query.where(filterName,"==",filterValue);
            values[filterName] = filterValue;
            //console.log("filter : "+filterName+" == "+filterValue, values);
        }else{
            if($profile != null && $permissions.asign_inventory){
                //console.log('branch inventory',$profile);
                filterName = 'branches';
                filterValue = $profile.branches;
                query = query.where(filterName,"==",filterValue);
                values[filterName] = filterValue;
            }
        }
        //.orderBy('added','desc')
        unsubscribe = query.orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                //console.log(`${doc.id} => ${doc.data()}`);
                const temppastinventory = doc.data();
                temppastinventory.id = doc.id;
                
                tmp.push(temppastinventory);
                if(temppastinventory.products != undefined && temppastinventory.quantity != undefined ){
                    values[temppastinventory.products] = temppastinventory.quantity;
                    maxQ[temppastinventory.products] = temppastinventory.quantity;
                    for(var prod of $products){
                        if(prod.id == temppastinventory.products){
                            temppastinventory.store = prod.store;
                            temppastinventory.unit = prod.unit;
                            temppastinventory.cost = prod.cost ?? 0;
                            if(prod.type == undefined){
                                temppastinventory.type = 0;
                            }else{
                                temppastinventory.type = prod.type;
                            }
                            
                        }
                    }
                }
                
            });
            /*var odata = tmp.sort(function(a, b){
	    		//console.log(a.RowId,b.RowId);
			  	//return a.RowId > b.RowId;
			  	if (a.RowId < b.RowId) return -1
  				return a.RowId > b.RowId ? 1 : 0
			});*/
            pastinventory = tmp;
            await tick();
            if(datatable == undefined){
                
                loadData();
            }else{
                //datatable.clear();
            }
    
            //datatable.rows('dom').invalidate();
        });

        var docRef = db.collection("pastinventory").where('added',">",start.toJSDate()).where('added',"<",end.toJSDate()).where(filterName,"==",filterValue);

        docRef.get().then(function(doc) {
            //console.log(doc);
            if (doc.size > 0) {
                console.log("Got inventory! "+pastId, doc.docs[0].id, doc.docs[0].data().added);
                //console.log("Document data:", doc.docs[0].data());
                values.edited = timenow;
                values = Object.assign(values, doc.docs[0].data());
                
                pastId =  doc.docs[0].id;
                dayName += ". Capturado "+DateTime.fromJSDate(doc.docs[0].data().added.toDate()).setLocale("es-mx").toRelative({ days: 1 });//doc.docs[0].data().added.toString();
                
            } else {
                // doc.data() will be undefined in this case
                console.log("No recorded inventory!");
                values.added = timenow;
                values.dayId = dayId;
            }
        });
    }

    function getLast(){
        var docRef = db.collection("pastinventory").where(filterName,"==",filterValue).orderBy('added','desc');

        docRef.get().then(function(doc) {
            //console.log(doc);
            if (doc.size > 0) {
                console.log("Got inventory! "+pastId, doc.docs[0].id, doc.docs[0].data());
                //console.log("Document data:", doc.docs[0].data());
                values.edited = timenow;
                values = Object.assign(values, doc.docs[0].data());
                
                pastId =  doc.docs[0].id;
                dayName += ". Capturado "+DateTime.fromJSDate(doc.docs[0].data().added.toDate()).setLocale("es-mx").toRelative({ days: 1 });//doc.docs[0].data().added.toString();
                
            } else {
                // doc.data() will be undefined in this case
                console.log("No recorded inventory!");
                values.added = timenow;
                values.dayId = dayId;
            }
        });
    }
    
    function saveData(){
        //console.log(values);
        loading = true;
        
        for (let index = 0; index < pastinventory.length; index++) {
            const element = pastinventory[index];
            var toOrer = element.quantity - values[element.products];
            if(toOrer != undefined && toOrer > 0){
                element.deliver = false;
                element.dayId = dayId;
                element.quantity = toOrer;
                element.added = timenow;
                
                for(var prod of $products){
                    if(prod.id == element.products){
                        element.store = prod.store;
                        element.unit = prod.unit;
                        element.cost = prod.cost == undefined ? 0: prod.cost;
                        if(prod.type == undefined){
                            element.type = 0;
                        }else{
                            element.type = prod.type;
                        }
                        
                    }
                }
                console.log("Added ",element);
                db.collection("productorders").add(element);
            }
            
            
        }
        
        db.collection("pastinventory").add(values).then(function(doc){
            pastId = doc.id;
            loading = false;
            //console.log("saved", doc);
            //pop();
        });

        
    }
    </script>
    
        
    
    <div class="page-content">
        
        <TitleBar title="Historial" base="Inventario" />
    
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Inventario para el día: {dayName} <button on:click={getLast} class="btn btn-light waves-effect waves-light">Cargar último</button></h4>
                    <p>&nbsp;</p>
                     {#if filterName != undefined && filterValue != undefined}
                        <FilterName node={filterName} value={filterValue} />
                     {/if}
                    <p>&nbsp;</p>
                     <div class="table-rep-plugin">
                        <div class="table-responsive mb-0" data-pattern="priority-columns">
                            <table id="tech-companies-1" class="table table-striped">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                
                                <th>Meta</th>
                                <th>Inventario Actual</th>
                                <th>A pedir</th>                
                            </tr>
                        </thead>
    
                        <tbody>
                            
                            {#each pastinventory as row}
                                {#if row.quantity>0}
                            <tr>
                                <td><ProductsSearchList value={row.products} inlist={true} /></td>
                                
                                <td>{row.quantity} {row.unit}</td>
                                <td><div class="form-group">
                                    <input data-toggle="touchspin" class:weight={row.unit == 'gramo' || row.unit == 'kilo'} type="number" bind:value={values[row.products]} data-name={row.products} disabled={pastId!=""} required />
                                </div></td>
                                <td>{row.quantity - values[row.products]} {row.unit}</td>
                                
                            </tr>
                            {/if}
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
        <div class="row"><div class="col">Notas: <textarea name="notas" id="notas" cols="30" rows="10" bind:value={values.notes}></textarea></div><div class="col-3">
            {#if pastId == ""}
                <button
                on:click={saveData}
                class="btn btn-primary waves-effect waves-light" disabled={loading}>
                Generar Pedido</button>
            {:else}
                Pedido solicitado
            {/if}
            </div>
        </div>
    </div>

    <style>
        .table-responsive[data-pattern="priority-columns"]>.table>thead>tr>th, .table-responsive[data-pattern="priority-columns"]>.table>tbody>tr>th, .table-responsive[data-pattern="priority-columns"]>.table>tfoot>tr>th, .table-responsive[data-pattern="priority-columns"]>.table>thead>tr>td, .table-responsive[data-pattern="priority-columns"]>.table>tbody>tr>td, .table-responsive[data-pattern="priority-columns"]>.table>tfoot>tr>td {
    white-space: normal;
}
    .form-group input {min-width: 66px;}
    </style>