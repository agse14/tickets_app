<script>

    import {link} from 'svelte-spa-router';
    import TitleBar from "../TitleBar.svelte"    
    import { onMount, onDestroy , tick} from 'svelte'
    import {push, pop, replace} from 'svelte-spa-router'
    import FilterName from '../controls/FilterName.svelte';
    import {branches} from "../controls/branches.js"
    import BranchesSearchList from "../controls/BranchesSearchList.svelte"
    import {users} from "../controls/users.js"
    import UsersSearchList from "../controls/UsersSearchList.svelte"
    
    
        //export let params = {};
        let pastinventory = [];
        let datatable;
        let unsubscribe;
        let docs;
    
        let filterName = 'branches';//params.field;
        let filterValue = '';//params.value;
        let series = {};
        let weeks = {};
        let categories =[];
        let chart;
        let start = DateTime.local().minus({months: 6});
        let end = DateTime.local();


        $: filterValue, processDocs();
        loadFireStore();
        
        onMount(() => {
            jQuery("#start").change(function () {
                start = DateTime.fromFormat(jQuery('#start').val(), "LL/dd/yyyy");
                //console.log();
                loadFireStore();
            });
            jQuery("#end").change(function () {
                end = DateTime.fromFormat(jQuery('#end').val(), "LL/dd/yyyy");
                //console.log(jQuery('#end').val());
                loadFireStore();
            });
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
        
        function loadFireStore(){
            if(unsubscribe != null && unsubscribe != undefined){
                unsubscribe();
                pastinventory = [];
            }
            
            let query = db.collection("workpay");
            if(filterValue != undefined && filterValue != ''){
                console.log("filter : "+filterName+" == "+filterValue,filterValue)
                //query = query.where('branches',"==",filterValue);
            }
            //.orderBy('added','desc')
            unsubscribe = query.where('added',">",start.toJSDate()).where('added',"<",end.toJSDate()).orderBy('added','asc').onSnapshot(async (querySnapshot) => {
                docs = querySnapshot;
                processDocs();
            });
        }

        async function processDocs(){
            if( docs == undefined){
                return;
            }
            const tmp = {};
            weeks = {};
                
            docs.forEach((doc) => {

                    //console.log(`${doc.id} => ${doc.data()}`, doc.data());
                    const temppastinventory = doc.data();
                    if(filterValue == "" || temppastinventory.branches == filterValue){
                            
                        const addedDate = DateTime.fromSeconds(temppastinventory.added.seconds).setLocale("es-mx");
                        const wId = addedDate.toFormat('yyyy-WW');
                        if(weeks[wId] == undefined){
                            
                            weeks[wId] = {};
                        }
                        if(weeks[wId][temppastinventory.branches] == undefined){
                            
                            weeks[wId][temppastinventory.branches] = {total:0};
                        }
                        weeks[wId][temppastinventory.branches].total += 200;
                        //console.log("sum "+temppastinventory.branches,temppastinventory.cost, temppastinventory.quantity, weeks[wId][temppastinventory.branches].total);

                        temppastinventory.id = doc.id; 
                        if(tmp[temppastinventory.users] == undefined){
                            tmp[temppastinventory.users] ={quantity:0, cost:0, total:0};
                        }

                        //tmp.push(temppastinventory);
                        tmp[temppastinventory.users].quantity += 1;
                        tmp[temppastinventory.users].cost = 200;
                        tmp[temppastinventory.users].total += 200; 
                        //console.log("sum prod "+temppastinventory.users,temppastinventory.cost, temppastinventory.quantity, tmp[temppastinventory.users].cost);
                    }
                    
                });
                //console.log(weeks);
                weeks = weeks;
                var arr = [];
                for(var [key, value] of Object.entries(tmp )){
                    arr.push({products:key, total: value.total, cost: value.cost, quantity:value.quantity});
                }
                pastinventory = arr;
                await tick();
                if(datatable == undefined){
                    
                    loadData();
                }else{
                    //datatable.clear();
                }
                createChart();
                weeksToSeries();
                //datatable.rows('dom').invalidate();
        }
    function weeksToSeries(){
        categories = [];
        series = [];
        let stemp = {};
        //Object.entries(values) as [cat_key, cat_val]
        for (var [key, value] of Object.entries(weeks)) {
            console.log(key + ' ', value);

            
            if(filterValue == ""){
                categories.push(key);
                
                for(var br of $branches){
                    if(stemp[br.id] == undefined){
                        stemp[br.id]= {data:[]};
                    }
                    if(value[br.id] != undefined){
                        //insert data 
                        stemp[br.id].data.push(value[br.id].total);
                    }else{
                        //null
                        stemp[br.id].data.push(null);
                    }
                }
            }else{
                if(value[filterValue] != undefined){
                    if(stemp[filterValue] == undefined){
                        stemp[filterValue]= {data:[]};
                    }
                    stemp[filterValue].data.push(value[filterValue].total);
                    categories.push(key);
                    
                }
            }
            
        }

        for(var [key, value] of Object.entries(stemp )){
            var bName = key;
            for(var b of $branches){
                            if(b.id == key){
                                bName = b.name;
                            }
                        }
            series.push({
                name: bName,
                data: value.data
            });
        }
        console.log("series", series);
        chart.updateOptions({
                    xaxis: {
            categories: categories
        },
        yaxis: {
            forceNiceScale: true
        }
        });
        chart.updateSeries(series);
    }
    
    function createChart(){
        if(chart != undefined){
            return;
        }
        var options = {
            chart: {
            height: 380,
            type: 'line',
            zoom: {
                enabled: false
            },
            toolbar: {
                show: false
            }
            },
            //colors: ['#3b5de7', '#eeb902','#3b5d67', '#eeb98A','#3b5d33'],
            dataLabels: {
            enabled: true,
            },
            stroke: {
            width: [3, 3],
            curve: 'straight'
            },
            series: [{
            name: "High - 2018",
            data: [26, 24, 32, 36, 33, 31, 33]
            },
            {
            name: "Low - 2018",
            data: [14, 11, 16, 12, 17, 13, 12]
            }
            ],
            title: {
            text: 'Salarios',
            align: 'left'
            },
            grid: {
            row: {
                colors: ['transparent', 'transparent'], // takes an array which will be repeated on columns
                opacity: 0.2
            },
            borderColor: '#f1f1f1'
            },
            markers: {
            style: 'inverted',
            size: 6
            },
            xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            title: {
                text: 'Semana'
            }
            },
            yaxis: {
            title: {
                text: 'Sueldos'
            },
            min: 5,
            max: 40
            },
            legend: {
            position: 'top',
            horizontalAlign: 'right',
            floating: true,
            offsetY: -25,
            offsetX: -5
            },
            responsive: [{
            breakpoint: 600,
            options: {
                chart: {
                toolbar: {
                    show: false
                }
                },
                legend: {
                show: false
                },
            }
            }]
        }
        
        chart = new ApexCharts(
            document.querySelector("#line_chart_datalabel"),
            options
        );
        
        chart.render();
    }
    
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
                        //db.collection("pastinventory").doc(id).delete();
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
                        <div class="row">  
                            <div class="col-12"><h4 class="card-title">Reporte de salarios</h4></div>
                                <div class="col-lg-6"><BranchesSearchList bind:value={filterValue} allTag="Todas"/></div>
                        </div>
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="card">
                                <div class="card-body">
                                    <h4 class="card-title mb-4">Sucursal: {#if filterValue == ""}TODAS{:else}<BranchesSearchList value={filterValue} inlist={true}/>{/if}</h4>

                                    <div id="line_chart_datalabel" class="apex-charts" dir="ltr"></div>
                                </div>
                            </div>
                            <!--end card-->
                        </div>
                    </div>
                    <div class="row input-daterange input-group" data-provide="datepicker">
                        <div class="col-12"><label>Fechas</label></div>
                        <div class="col-6">
                            <div class="form-group mb-0">
                                Desde <br /><input type="text" class="form-control" id="start" name="start" value={start.toLocaleString(DateTime.DATE_SHORT)}  />
                            </div>
                        </div>
                        <div class="col-6">Hasta<br />
                            <input type="text" class="form-control" name="end" id="end" value={end.toLocaleString(DateTime.DATE_SHORT)} />
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    
                    
                     <div class="table-rep-plugin">
                        <div class="table-responsive mb-0" data-pattern="priority-columns">
                            <table id="tech-companies-1" class="table table-striped">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Asistencias</th>
                                <th>Sueldo</th>
                                <th>Total</th>                   
                            </tr>
                        </thead>
    
                        <tbody>
                            
                            {#each pastinventory as row}
                            <tr>
                                <td><UsersSearchList value={row.products} inlist={true} /></td>
                                <td>{row.quantity}</td>
                                <td>$ {row.cost}</td>
                                <td>$ {row.total} </td>
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