<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile } from "../stores.js";
    import Room_inventoryEdit from "./Room_inventoryEdit.svelte";

    import { branches } from "../controls/branches.js";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import BranchMap from "../controls/BranchMap.svelte";
    import { status as room_inventory_status } from "../controls/room_inventory.js";
    import { type as room_inventory_type } from "../controls/room_inventory.js";

    function checkVisibles() {}

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { flip } from "svelte/animate";

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

    export let params = {};
    export let loadDataTable = true;
    export let modal = true;
    //array [0 = doc field, 1=profile field]
    export let profileFilter = null;
    export let hasAdd = true;
    export let hasEdit = true;

    let room_inventory = [];

    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let loading = false;
    let showModal = false;

    let filterName = params.field;
    let filterValue = params.value;

    let editData = { field: filterName, value: filterValue, bid: undefined };

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
            if (!$permissions.admin && !$permissions.room_inventory) {
                console.log("not admin", value);

                filterName = profileFilter[0];
                filterValue =
                    value != undefined ? value[profileFilter[1]] ?? "" : "";
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
        datatable = jQuery("#room_inventory-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                [
                    "10 Habitaciones",
                    "25 Habitaciones",
                    "50 Habitaciones",
                    "Todo",
                ],
            ],
            data: room_inventory,
            columns: [
                {
                    data: "name",
                    name: "Identificador",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        return html(
                            '<a href="#/editroom_inventory/' +
                                id +
                                '">' +
                                data +
                                "</a>",
                        );
                    },
                },
                { data: "typeName", name: "Tipo de Habitación" },
                {
                    data: "cost",
                    name: "Costo",
                    render: function(data) {
                        if (data == null || data === "") {
                            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(0);
                        } else {
                            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data);
                        }
                    }
                }, 
                {
                    data: "restroom",
                    name: "Tiene baño",
                    render: function (data, type, row, meta) {
                        return data === true ? "Si" : "No";
                    },
                },
                { data: "statusName", name: "Estatus" },
                {
                    data: "lastOccupiedDate",
                    name: "Tiempo Desocupada",
                    render: function(data, type, row) {
                        if (row.status != 1) {
                            return "N/A - Ocupada";
                        }
                        
                        if (!data) {
                            return "Sin historial";
                        }
                        
                        // Calcular días transcurridos
                        const lastDate = data instanceof firebase.firestore.Timestamp ? 
                            data.toDate() : new Date(data);
                        const today = new Date();
                        const diffTime = Math.abs(today - lastDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let timeText = "";
                        if (diffDays === 0) {
                        timeText = "Hoy";
                        } else if (diffDays === 1) {
                        timeText = "1 día";
                        } else if (diffDays < 7) {
                        timeText = `${diffDays} días`;
                        } else if (diffDays < 30) {
                        const weeks = Math.floor(diffDays / 7);
                        timeText = `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
                        } else if (diffDays < 365) {
                        const months = Math.floor(diffDays / 30);
                        timeText = `${months} ${months === 1 ? 'mes' : 'meses'}`;
                        } else {
                        const years = Math.floor(diffDays / 365);
                        timeText = `${years} ${years === 1 ? 'año' : 'años'}`;
                        }
                        
                        const dateText = lastDate.toLocaleDateString("es-MX");
                        return `${timeText}<br><small class="text-muted">${dateText}</small>`;
                    }
                },
                { 
                    data: "notes", 
                    name: "Observaciones",
                    render: function(data, type, row) {
                        return data === undefined ? '' : data;
                    }
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
                                    '<a href="#/editroom_inventory/' +
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
            .appendTo("#room_inventory-dt_wrapper .col-md-6:eq(0)");
    }
    function loadFirebaseData() {
        let query = db.collection("room_inventory");
        if (filterName != undefined && filterValue != undefined) {
            console.log("filter : " + filterName + " == " + filterValue);
            query = query.where(filterName, "==", filterValue);
        }

        unsubscribe = query
            .orderBy("added", "desc")
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                // Use for...of with async/await
                for (const doc of querySnapshot.docs) {
                    // console.log(`${doc.id} => ${doc.data()}`);
                    const temproom_inventory = doc.data();
                    temproom_inventory.id = doc.id;
                    temproom_inventory.did = doc.id;

                    // Buscar la última fecha de desocupación si el status es 1 (disponible/desocupado)
                    if (temproom_inventory.status == 1) {
                        try {
                            // Buscar en rooms_history el último registro de DESOCUPACIÓN para este cuarto
                            const historyQuery = await db.collection("rooms_history")
                                .where("roomId", "==", doc.id)  // ← Usar roomId en lugar de details.newRoom
                                .where("type", "in", ["room_vacated", "room_vacated_discharge"])  // ← Solo registros de desocupación
                                .orderBy("date", "desc")
                                .limit(1)
                                .get();
                            
                            if (!historyQuery.empty) {
                                const lastHistory = historyQuery.docs[0].data();
                                temproom_inventory.lastOccupiedDate = lastHistory.date;
                                console.log(`Habitación ${doc.id} desocupada el:`, lastHistory.date);
                            } else {
                                temproom_inventory.lastOccupiedDate = null;
                                console.log(`No hay historial de desocupación para habitación ${doc.id}`);
                            }
                        } catch (error) {
                            console.error("Error getting last occupied date:", error);
                            temproom_inventory.lastOccupiedDate = null;
                        }
                    } else {
                        temproom_inventory.lastOccupiedDate = null;
                    }   

                    console.log(temproom_inventory.notes);
                    temproom_inventory.branchesName = "";
                    $branches.forEach((element) => {
                        if (element.id == temproom_inventory.branches) {
                            temproom_inventory.branchesName = element.name;
                        }
                    });
                    temproom_inventory.typeName =
                        temproom_inventory.type != undefined &&
                        room_inventory_type[temproom_inventory.type] !=
                            undefined
                            ? room_inventory_type[temproom_inventory.type]
                            : "";
                    temproom_inventory.statusName =
                        temproom_inventory.status != undefined &&
                        room_inventory_status[temproom_inventory.status] !=
                            undefined
                            ? room_inventory_status[temproom_inventory.status]
                            : "";
                    // temproom_inventory.notesRoom =
                    //     temproom_inventory.notes != undefined &&
                    //     room_inventory_status[temproom_inventory.notes] !=
                    //         undefined
                    //         ? room_inventory_status[temproom_inventory.notes]
                    //         : "";

                    tmp.push(temproom_inventory);
                }
                room_inventory = tmp;
                await tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(room_inventory).draw(false);
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
                db.collection("room_inventory").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("room_inventory").doc(id).update(update);
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
</script>

<div class="page-content">
    <TitleBar title="Habitaciones" base="Inventario" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración Habitaciones</h4>
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
                            <div class="col"></div>

                            <div class="col-md-auto align-self-end">
                                {#if modal}
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}>Agregar Habitación</button
                                    >
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addroom_inventory/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue,
                                                );
                                            } else {
                                                push("/addroom_inventory");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        ></i> Agregar Habitación</button
                                    >
                                {/if}
                            </div>
                        </div>
                    {/if}
                    <BranchMap branch={filterValue} />

                    <table
                        id="room_inventory-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Identificador</th>
                                <th>Tipo de Espacio</th>
                                <th>Costo</th>
                                <th>Tiene baño</th>
                                <th>Estatus</th>
                                <th>Tiempo Desocupada</th>
                                <th>Observaciones</th>
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
                                        Agregar Habitación
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
                                    <Room_inventoryEdit
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

<!--
    {#each room_inventory as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            <td><a href="/editroom_inventory/{row.id}" use:link>{row.name}</a></td>
<td><Room_inventoryTypeListSelect value={row.type} inlist={true} /></td>
<td>{row.restroom?'Si':'No'}</td>
<td><Room_inventoryStatusListSelect value={row.status} inlist={true} /></td>

                            <td>
                                {#if hasEdit}
                                    {#if modal}
                                    <button type="button" class="btn btn-light waves-effect" on:click={()=>{ setEditId(row.id);}}><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>
                                    {:else}
                                     <a href="/editroom_inventory/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                                    {/if}
                                {/if}
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>
                            </td>
                        </tr>
                        {/each}
-->
