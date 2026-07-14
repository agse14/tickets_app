<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile } from "../stores.js";
    import SupervisionEdit from "./SupervisionEdit.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte"

    import { branches } from "../controls/branches";
    import SupervisionStepsNew from "../controls/SupervisionStepsNew.tw.svelte";
    import StepOptions from "../controls/StepOptions.svelte";

    function checkVisibles() {}

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { flip } from "svelte/animate";
    import 'iconify-icon';

    const [send, receive] = crossfade({
        duration: (d) => Math.sqrt(d * 200),

        fallback(node, params) {
            const style = getComputedStyle(node);
            const transform = style.transform === "none" ? "" : style.transform;

            return {
                duration: 600,
                easing: quintOut,
                css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`,
            };
        },
    });

    export let bid;
    console.log("bid", bid);
    export let params = {};
    export let loadDataTable = true;
    export let modal = true;
    //array [0 = doc field, 1=profile field]
    export let profileFilter = null;
    export let hasAdd = true;
    export let hasEdit = true;

    let today = DateTime.local();

    let supervision = [];
    let supervision_week;
    let supervision_weekLast;
    let supervision_weekValues = {};
    let start = DateTime.local().startOf("month").toISODate();
    let end = DateTime.local().endOf("month").toISODate();
    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let unsubWeek;
    let loading = false;
    let showModal = false;

    let filterName = params.field;
    let filterValue = params.value;

    let editData = { field: filterName, value: filterValue, bid: undefined };
    let supervisionByBranch = {};

    $: start, end, bid, loadFirebaseData();

    onDestroy(() => {
        if (datatable != undefined && datatable != null) {
            datatable.clear();
            datatable.destroy();
            datatable = undefined;
        }
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
            unsubscribe = undefined;
        }
    });

    if (profileFilter !== null) {
        unsubscribeProfile = profile.subscribe((value) => {
            if (value == undefined && !$permissions.admin) {
                console.log("no profile");
                return;
            }
            if (!$permissions.admin && !$permissions.supervision) {
                console.log("not admin", value);

                filterName = profileFilter[0];
                filterValue =
                    value != undefined ? (value[profileFilter[1]] ?? "") : "";
            }
            // else{
            //     hasEdit = true;
            // }
            loadFirebaseData();
        });
    } else {
        loadFirebaseData();
    }
    function loadData() {
        if (!loadDataTable) {
            return;
        }
        
        datatable = jQuery("#supervision-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Inspección", "25 Inspección", "50 Inspección", "Todo"],
            ],
            data: supervision,
            createdRow: function (row, data, index) {
                const stepel = jQuery("#step" + data.id, row).get(0);
                if (stepel != null) {
                    supervision[index].stepControl = new SupervisionStepsNew({
                        target: stepel,
                        props: {
                            value: data["step"],
                            data: data,
                            inlist: true,
                        },
                    });
                }
            },
            columns: [
                {
                    data: "added",
                    name: "Fecha",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        
                        // Convertimos el valor a una fecha utilizando Luxon
                        var date = DateTime.fromJSDate(data.toDate()).setLocale("es-mx");
                        
                        // Formateo con fecha y hora
                        var formattedDate = date.toLocaleString({
                            ...DateTime.DATE_MED_WITH_WEEKDAY, // Incluye la fecha con día de la semana
                            hour: "2-digit",                  // Formato de hora en 2 dígitos
                            minute: "2-digit",                // Formato de minuto en 2 dígitos
                        });

                        // Devolver el valor según el tipo (sort o display)
                        return type == "sort"
                            ? date.toISODate()
                            : html(
                                '<a href="#/editsupervision/' +
                                    id +
                                    '">' +
                                    formattedDate +
                                    "</a>",
                            );
                    },
                },
                {
                    data: "step",
                    name: "Resultados",
                    render: function (data, type, row, meta) {
                        return html('<div id="step' + row.id + '"></div>');
                    },
                },
                {
                    data: "branchesName",
                    name: "Estas generando reporte de la estancia",
                    width: "auto",
                },
                {
                    data: "did",
                    name: "Acciones",
                    render: function (data, type, row, meta) {
                        let buttons = "";
                        if (hasEdit) {
                            if (modal) {
                                buttons +=
                                    '<button type="button" class="btn btn-light waves-effect" onclick="setEditId(\'' +
                                    data +
                                    '\');"><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>';
                            } else {
                                buttons +=
                                    '<a href="#/editsupervision/' +
                                    data +
                                    '" class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
                            }
                        }

                        return html(
                            buttons +
                                "<button onclick=\"deleteDoc('" +
                                data +
                                '\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button>',
                        );
                    },
                },
            ],
            language: {
                lengthMenu: "Ver _MENU_",
                info: "Mostrando _PAGE_ de _PAGES_ páginas",
                search: "Buscar:",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior",
                },
            },
            buttons: ["copy", "excel", "pdf"],
            responsive: true,
            scrollX: true,
        });

        datatable
            .buttons()
            .container()
            .appendTo("#supervision-dt_wrapper .col-md-6:eq(0)");
    }
    function loadFirebaseData() {
        let newstart = DateTime.fromISO(start).toJSDate();
        let newend = DateTime.fromISO(end).endOf("day").toJSDate();

        let query = db.collection("supervision")
        .where("added", ">=", newstart)
        .where("added", "<=", newend);
        if(bid != undefined && bid != ""){
            console.log(bid)
            query = query.where("branches","==",bid);
        }


        unsubWeek = db.collection("supervision_week")
            .orderBy("added", "desc")
            .limit(2)
            .onSnapshot((querySnapshot) => {
                if(querySnapshot.size > 0){
                    let thisWeek = DateTime.local().startOf("week").toJSDate();
                    let lastSupDate = DateTime.fromJSDate(querySnapshot.docs[0].data().added.toDate());
                    if(lastSupDate < thisWeek){
                        supervision_week = undefined;
                        supervision_weekValues = {};
                        supervision_weekLast = querySnapshot.docs[0].data();
                        supervision_weekLast.id = querySnapshot.docs[0].id;
                    }else{
                        supervision_week = querySnapshot.docs[0].data();
                        supervision_week.id = querySnapshot.docs[0].id;
                        if(querySnapshot.size > 1){
                            supervision_weekLast = querySnapshot.docs[1].data();
                            supervision_weekLast.id = querySnapshot.docs[1].id;
                        }
                    }
                    
                    
                }else{
                    supervision_week = undefined;
                }

            });

        unsubscribe = query
            .orderBy("added", "desc")
            .onSnapshot(async (querySnapshot) => {
                let thisWeek = DateTime.local().startOf("week").toJSDate();
                let endWeek = DateTime.local().endOf("week").toJSDate();
                supervisionByBranch = {};
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    // console.log(`${doc.id} => ${doc.data()}`);
                    const tempsupervision = doc.data();
                    tempsupervision.id = doc.id;
                    tempsupervision.did = doc.id;

                    tempsupervision.branchesName = "";
                    $branches.forEach((elbranches) => {
                        if (elbranches.id == tempsupervision.branches) {
                            tempsupervision.branchesName = elbranches.name;
                        }
                    });

                    // if is this week add to supervisionByBranch
                    if(tempsupervision.added != undefined){
                        let added = DateTime.fromJSDate(tempsupervision.added.toDate());
                        tempsupervision.addedDate = added;
                        if(added >= thisWeek && added <= endWeek){
                            supervisionByBranch[tempsupervision.branches]= tempsupervision;
                        }
                    }

                    

                    tmp.push(tempsupervision);
                });
                supervision = tmp;
                await tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(supervision).draw(false);
                }
                // if(datatable != undefined){
                //     datatable.rows('dom').invalidate().draw(false);
                // }
            });
    }

    function html(data) {
        return data;
    }
    function setEditId(eId) {
        editData = { field: filterName, value: filterValue, bid: eId };
        showModal = true;
        jQuery("#editModalScrollable").modal("show");
    }

    function deleteDoc(id) {
        Swal.fire({
            title: "¿Esta seguro?",
            text: "Desea eliminar este registro",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Si, borrarlo!",
        }).then(function (result) {
            if (result.value) {
                db.collection("supervision").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("supervision").doc(id).update(update);
    }
    window.setEditId = setEditId;
    window.deleteDoc = deleteDoc;
    window.asyncChange = asyncChange;

    function timeToAgo(timeStr) {
        if (timeStr == undefined || timeStr == "" || timeStr == null) {
            return "";
        }
        if (timeStr instanceof firebase.firestore.Timestamp) {
            return DateTime.fromJSDate(timeStr.toDate())
                .setLocale("es-mx")
                .toRelative({ days: 1 });
        }
        return DateTime.fromISO(timeStr)
            .setLocale("es-mx")
            .toRelative({ days: 1 });
    }
    function timeFormated(timeStr) {
        if (timeStr == undefined || timeStr == "" || timeStr == null) {
            return "";
        }
        if (timeStr instanceof firebase.firestore.Timestamp) {
            return DateTime.fromJSDate(timeStr.toDate())
                .setLocale("es-mx")
                .toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
        }
        return DateTime.fromISO(timeStr)
            .setLocale("es-mx")
            .toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
    }

    function runFunction(fid, params) {
        if (typeof fun[fid] === "function") {
            loading = true;
            fun[fid](params)
                .then((result) => {
                    // Read result of the Cloud Function.
                    var sanitizedMessage = result.data.text;
                    loading = false;
                })
                .catch((error) => {
                    loading = false;
                    // Getting the Error details.
                    var code = error.code;
                    var message = error.message;
                    var details = error.details;
                    Swal.fire({
                        title: "Error",
                        text: message,
                        type: "warning",
                        cancelButtonColor: "#f46a6a",
                    });
                });
        }
    }

    function saveWeek() {
            supervision_weekValues.added = DateTime.local().toJSDate();
            supervision_weekValues.status = 0;
            db.collection("supervision_week").add(supervision_weekValues);
    }
</script>

<div class="page-content">
    <TitleBar title="Inspección" base="Inventario" />
    <h2 class="text-4xl text-slate-400 my-8">Supervisiones realizadas esta semana</h2>
    <div class="flex flex-wrap md:flex-row gap-2">
        {#each $branches as branch}
            {#if branch.test != true}
                <div class="card p-4 sm:p-5 md:grow">
                    <div class="flex size-12 items-center justify-center rounded-xl {supervisionByBranch[branch.id] != undefined ? 'bg-success shadow-success/50': 'bg-warning shadow-warning/50'} shadow-xl ">
                        {#if supervisionByBranch[branch.id] != undefined}
                        <iconify-icon icon="material-symbols:check" class="text-white text-xl"></iconify-icon>
                        {:else}
                        <iconify-icon icon="material-symbols:warning" class="text-white text-xl"></iconify-icon>
                        {/if}
                    </div>
                    <p class="mt-8">{branch.name}</p>
                    <p class="mt-1 flex items-center text-xs text-success">
                    <span>
                        {#if supervisionByBranch[branch.id] != undefined}
                            {timeToAgo(supervisionByBranch[branch.id].added)}
                        {/if}
                    </span>
                    </p>
                </div>
            {/if}
          {/each}
    </div>
    <div class="card">
        <div class="border-b border-slate-200 p-4 dark:border-navy-500 sm:px-5">
          <div class="flex items-center space-x-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 p-1 text-primary dark:bg-accent-light/10 dark:text-accent-light">
              <i class="fa-solid fa-layer-group"></i>
            </div>
            <h4 class="text-lg font-medium text-slate-700 dark:text-navy-100">
              Junta de dirección semanal 
            </h4>
          </div>
        </div>
        <div class="space-y-4 p-4 sm:p-5">
            {#if supervision_week != undefined}
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label class="block">
                    <span>Minuta para la fecha {today.toLocaleString()}</span>
                    <p>{supervision_week.minuta}</p>
                </label>
                <div class="grid grid-cols-2 gap-4">
                    <label class="block">
                        <span>Acciones acordadas</span>
                        <p>{supervision_week.acciones}</p>
                    </label>
                </div>
                {#each $branches as branch}
                    {#if branch.test != true && supervision_week[branch.id] != undefined}
                        <div class="flex flex-col">
                            <label class="grid grid-cols-3 gap-2">
                                <span>{branch.name}: </span>
                                <p>{supervision_week[branch.id]}</p>
                            </label>
                        </div>
                    {/if}
                {/each}
            </div>
                
            {:else}
          <label class="block">
            <span>Minuta para la fecha {today.toLocaleString()}</span>
            
          </label>
          <textarea bind:value={supervision_weekValues.minuta} name="" id="" class="form-input mb-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70"></textarea>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div class="grid grid-cols-1 gap-4 w-full">
              <label class="block">
                <span>Acciones acordadas</span>
                <input bind:value={supervision_weekValues.acciones} class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" placeholder="Acciones" type="text">
                {#if supervision_weekLast != undefined}
                <p style="font-size: small;">Úlimas acciones acordadas: {supervision_weekLast.acciones ?? "n/d"}</p>
                {/if}
              </label>
              <!-- <label class="block">
                <span>Price</span>
                <input class="form-input mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" placeholder="Price" type="text">
              </label> -->
            </div>
          </div>
          <h3 class="text-lg text-slate-400">Notas para encargadas</h3>
          {#each $branches as branch}
            {#if branch.test != true}
                  <div class="flex flex-col">
                    <label class="grid grid-cols-3 gap-2">
                      <span>{branch.name}: </span>
                      <div class="flex flex-col">
                        <input bind:value={supervision_weekValues[branch.id]} class=" col-span-2 form-input mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" placeholder="Notas" type="text">
                        {#if supervision_weekLast != undefined}
                            <p style="font-size: small;">Notas pasadas: {supervision_weekLast[branch.id] ?? "n/d"}</p>
                        {/if}
                    </div>
                    </label>

                  </div>  
            {/if}
            {/each}
          <div class="">
            <!-- flex justify-center space-x-2 pt-4 <button class="btn space-x-2 bg-slate-150 font-medium text-slate-800 hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200/80 dark:bg-navy-500 dark:text-navy-50 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd"></path>
              </svg>
              <span>Prev</span>
            </button> -->
            <button on:click={saveWeek}  class="btn space-x-2 bg-primary font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90">
              <span>Guardar</span>
            </button>
          </div>
          {/if}
        </div>
      </div>   

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Filtrar supervisiones</h4>
                    
                    
                    <!-- {filterName} {filterValue} -->
                    {#if filterName != undefined && filterValue != undefined}
                        <FilterName
                            node={profileFilter != null
                                ? profileFilter[1]
                                : filterName}
                            value={filterValue}
                        />
                    {/if}
                    {#if hasAdd}
                        <div class="row">
                            <div class="col">
                                <div class="">
                                    <p>
                                        <label>Estancia:</label>
                                    </p>
                                    <p>
                                        <BranchesSearchList bind:value={bid} inlist={!hasEdit} />
                                    </p>
                                </div>
                            </div>

                            <div class="row input-group col-6">
                                <div class="col-12 no-print">
                                    <label>Fechas:</label>
                                </div>
                                <div class="col-6">
                                  <div class="form-group mb-0 no-print">
                                    Desde<br />
                                    <input
                                      type="date"
                                      class="form-control"
                                      id="start"
                                      name="start"
                                      bind:value={start}
                                    />
                                  </div>
                                </div>
                                <div class="col-6 no-print">
                                  Hasta<br />
                                  <input
                                    type="date"
                                    class="form-control"
                                    name="end"
                                    id="end"
                                    bind:value={end}
                                  />
                                </div>                                
                            </div>

                            <!-- <div class="col-md-auto align-self-end">
                                {#if modal}
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}
                                        >Agregar Inspecciones de Supervisión</button
                                    >
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addsupervision/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue,
                                                );
                                            } else {
                                                push("/addsupervision");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        ></i> Agregar Inspecciones de Supervisión</button
                                    >
                                {/if}
                            </div> -->
                        </div>
                    {/if}
                    <!-- <SupervisionHead data={supervision} /> -->

                    <table
                        id="supervision-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Resultados</th>
                                <th>Estas generando reporte de la estancia</th>

                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody> </tbody>
                    </table>

                    <div
                        class="modal fade"
                        id="editModalScrollable"
                        tabindex="-1"
                        role="dialog"
                        aria-labelledby="editModalScrollableTitle"
                        aria-hidden="true"
                    >
                        <div class="modal-dialog modal-dialog-scrollable">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5
                                        class="modal-title mt-0"
                                        id="editModalScrollableTitle"
                                    >
                                        Agregar Inspecciones de Supervisión
                                    </h5>
                                    <button
                                        type="button"
                                        class="close"
                                        on:click={() => {
                                            editData = {
                                                field: filterName,
                                                value: filterValue,
                                                bid: undefined,
                                            };
                                            jQuery(
                                                "#editModalScrollable",
                                            ).modal("hide");
                                            showModal = false;
                                        }}
                                        aria-label="Close"
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                {#if showModal}
                                    <SupervisionEdit
                                        params={editData}
                                        onBack={() => {
                                            editData = {
                                                field: filterName,
                                                value: filterValue,
                                                bid: undefined,
                                            };
                                            jQuery(
                                                "#editModalScrollable",
                                            ).modal("hide");
                                            showModal = false;
                                        }}
                                    />
                                {/if}
                            </div>
                            <!-- /.modal-content -->
                        </div>
                        <!-- /.modal-dialog -->
                    </div>
                </div>
            </div>
        </div>
        <!-- end col -->
    </div>
    <!-- end row -->
</div>
<svelte:head>
    <link href="assets/css/output.css" rel="stylesheet" />
</svelte:head>