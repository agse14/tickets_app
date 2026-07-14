<script>
    /* global jQuery */
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import { permissions, profile, fbuser } from "../stores.js";
    // import { DateTime } from 'luxon';

    export let params = {};
    export let loadDataTable = true;
    export let modal = false; // Changed to false to use navigation instead of modal
    export let hasAdd = true;
    export let hasEdit = true;

    let sprints = [];
    let datatable;
    let unsubscribe;
    let loading = false;

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

    onMount(() => {
        loadFirebaseData();
    });

    function loadData() {
        if (!loadDataTable) {
            return;
        }
        datatable = jQuery("#sprints-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Sprints", "25 Sprints", "50 Sprints", "Todo"],
            ],
            data: sprints,
            createdRow: function (row, data, index) {},
            columns: [
                {
                    data: "name",
                    name: "Nombre",
                    width: "auto"
                },
                {
                    data: "startDate",
                    name: "Fecha Inicio",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        if (!data) return "";
                        const date = data.toDate ? data.toDate() : new Date(data);
                        return DateTime.fromJSDate(date).toLocal().toFormat('dd/MM/yyyy');
                    }
                },
                {
                    data: "endDate",
                    name: "Fecha Fin",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        if (!data) return "";
                        const date = data.toDate ? data.toDate() : new Date(data);
                        return DateTime.fromJSDate(date).toLocal().toFormat('dd/MM/yyyy');
                    }
                },
                {
                    data: "status",
                    name: "Estado",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        let statusClass = "";
                        let statusText = "";
                        switch(data) {
                            case 'active': 
                                statusClass = "badge-success"; 
                                statusText = "Activo";
                                break;
                            case 'completed': 
                                statusClass = "badge-secondary"; 
                                statusText = "Completado";
                                break;
                            case 'planned': 
                                statusClass = "badge-primary"; 
                                statusText = "Planificado";
                                break;
                            default:
                                statusClass = "badge-light";
                                statusText = data;
                        }
                        return `<span class="badge ${statusClass}">${statusText}</span>`;
                    }
                },
                {
                    data: "description",
                    name: "Descripción",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        if (!data) return "-";
                        if (data.length > 50) {
                            return data.substring(0, 50) + "...";
                        }
                        return data;
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
                                    '<button type="button" class="btn btn-light waves-effect" onclick="setEditSprintId(\'' +
                                    data +
                                    '\');"><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>';
                            } else {
                                buttons +=
                                    '<a href="#/editsprints/' +
                                    data +
                                    '" class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
                            }
                        }

                        if (row.status !== 'active') {
                            buttons += '<button type="button" class="btn btn-success waves-effect waves-light" onclick="activateSprint(\'' +
                                data +
                                '\');"><i class="bx bx-play font-size-16 align-middle"></i></button>';
                        }

                        if (row.status === 'active') {
                            buttons += '<a href="#/sprintboard/' +
                                data +
                                '" class="btn btn-info waves-effect waves-light"><i class="bx bx-show font-size-16 align-middle"></i></a>';
                        }

                        if($permissions.admin) {
                            buttons += "<button onclick=\"deleteSprint('" +
                                data +
                                '\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button>';
                        }

                        return buttons;
                    },
                },
            ],
            language: {
                lengthMenu: "Ver _MENU_",
                info: "Mostrando _PAGE_ de _PAGES_ páginas",
                "search":  "Buscar:",
                paginate: {
                    first: "Primero",
                    last: "Último",
                    next: "Siguiente",
                    previous: "Anterior",
                },
            },
            buttons: [
                {
                    extend: 'copy',
                    filename: 'Listado de Sprints'
                },
                {
                    extend: 'excel',
                    filename: 'Listado de Sprints'
                },
                {
                    extend: 'pdf',
                    filename: 'Listado de Sprints'
                }
            ],
            responsive: true,
            scrollX: true,
            fixedColumns: true,
            order: [[ 1, "desc" ]] // Order by start date desc
        });

        datatable
            .buttons()
            .container()
            .appendTo("#sprints-dt_wrapper .col-md-6:eq(0)");
    }

    function loadFirebaseData() {
        let query = db.collection("sprints");

        unsubscribe = query
            .orderBy('startDate', 'desc')
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    const tempSprint = doc.data();
                    tempSprint.id = doc.id;
                    tempSprint.did = doc.id;

                    // Ensure dates are Date objects
                    if (tempSprint.startDate && tempSprint.startDate.toDate) {
                        tempSprint.startDate = tempSprint.startDate.toDate();
                    }
                    if (tempSprint.endDate && tempSprint.endDate.toDate) {
                        tempSprint.endDate = tempSprint.endDate.toDate();
                    }

                    tmp.push(tempSprint);
                });
                
                sprints = tmp;
                await tick();
                
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(sprints).draw(false);
                }
            });
    }

    function setEditSprintId(eId) {
        if (eId) {
            // Navigate to edit sprint
            push(`/editsprints/${eId}`);
        } else {
            // Navigate to add new sprint
            push("/addsprints");
        }
    }

    async function activateSprint(sprintId) {
        try {
            // First, deactivate all other sprints
            const activeSprintsQuery = await db.collection("sprints").where('status', '==', 'active').get();
            const updatePromises = activeSprintsQuery.docs.map(doc =>
                doc.ref.update({ status: 'completed' })
            );

            await Promise.all(updatePromises);

            // Then activate the selected sprint
            await db.collection("sprints").doc(sprintId).update({
                status: 'active',
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error activating sprint:', error);
            alert('Error activating sprint: ' + error.message);
        }
    }

    function deleteSprint(id) {
        Swal.fire({
            title: "¿Está seguro?",
            text: "Desea eliminar este sprint",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Sí, borrarlo!",
        }).then(function (result) {
            if (result.value) {
                db.collection("sprints").doc(id).delete();
            }
        });
    }

    function closeModal() {
        // No longer needed since we use navigation
    }

    // Global functions for DataTable buttons
    window.setEditSprintId = setEditSprintId;
    window.activateSprint = activateSprint;
    window.deleteSprint = deleteSprint;
</script>

<div class="page-content">
    <TitleBar title="Gestión de Sprints" base="Administración" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración de Sprints</h4>
                    
                    {#if hasAdd}
                        <div class="row">
                            <div class="col" />

                            <div class="col-md-auto align-self-end">
                                {#if modal}
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditSprintId(undefined);
                                        }}>Crear Sprint</button
                                    >
                                {:else}
                                    <button
                                        on:click={() => push("/addsprints")}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        /> Crear Sprint</button
                                    >
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <table
                        id="sprints-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Fecha Inicio</th>
                                <th>Fecha Fin</th>
                                <th>Estado</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>