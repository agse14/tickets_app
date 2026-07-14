<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile } from "../stores.js";
    import Supervision_tags_checkEdit from "./Supervision_tags_checkEdit.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { branches } from "../controls/branches";
    import { supervision_tags } from "../controls/supervision_tags";
    import { users } from "../controls/users";

    function checkVisibles() {}

    import { quintOut } from "svelte/easing";
    import { crossfade } from "svelte/transition";
    import { flip } from "svelte/animate";
    import TagsCheck from "../controls/TagsCheck.svelte";
    import { each } from "svelte/internal";
    import TagsCompleted from "../controls/TagsCompleted.svelte";

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

    let today = DateTime.local();
    let todayValue = today.toISODate();
    let last4Weeks = today.minus({ days: 28 });
    let view = 0;

    let supervision_tags_check = [];

    let datatable;
    let unsubscribe;
    let unsubscribeProfile;
    let loading = false;
    let showModal = false;

    let filterName = params.field;
    let filterValue = params.value;

    let editData = { field: filterName, value: filterValue, bid: undefined };

    let branch;
    let checksDates = {};
    let completed = {};
    let tags = [];
    $: filterValue, loadBranch();
    let branchesUnsubscribe = branches.subscribe((value) => {
        loadBranch();
    });

    function loadBranch() {
        checksDates = {};
        tags = [];

        if (
            filterValue != undefined &&
            filterValue != null &&
            filterValue != ""
        ) {
            if ($branches.length == 0) {
                return;
            }
            let tmp = $branches.filter((el) => {
                return el.id == filterValue;
            });
            if (tmp.length > 0) {
                branch = tmp[0];
            }
        }
        completed = {};

        // for today minus 7 days to today
        for (let index = 0; index < 7; index++) {
            const date = today.minus({ days: index });
            completed[date.toISODate()] = { date: date, total: 0 };
        }

        $supervision_tags.forEach((el) => {
            if (el.branches == filterValue && el.statusId == 0) {
                tags.push(el);
            }
        });
        // let filteredTags = [];
        for (const sc of supervision_tags_check) {
            if (sc.branches == filterValue) {
                if (sc.added != undefined) {
                    const date = DateTime.fromJSDate(
                        sc.added.toDate(),
                    ).setLocale("es-mx");
                    sc.addedTime = date;
                    // if date is in the last 2 days
                    // let last2 = today.minus({ days: 2 });
                    // if(date > last2){
                    //     let hourFiltered = date.toLocaleString(DateTime.TIME_SIMPLE);
                    //     filteredTags.push({day:date.toISODate(), hour:hourFiltered ,tag:sc});
                    // }

                    let branchHours = [];
                    if (branch != undefined && branch.night != undefined) {
                        for (const hour of branch.night) {
                            branchHours.push({
                                hour: hour.night_hour,
                                checks: [],
                            });
                        }
                    }
                    if (checksDates[date.toISODate()] == undefined) {
                        checksDates[date.toISODate()] = {
                            date: date,
                            checks: [],
                            hours: branchHours,
                        };
                    }

                    let found = false;
                    for (const hour of checksDates[date.toISODate()].hours) {
                        let nhour = hour.hour.split(":");
                        let checkHour = date
                            .set({
                                hour: nhour[0],
                                minute: nhour[1],
                                second: 0,
                                millisecond: 0,
                            })
                            .minus({ minutes: 30 });
                        const ihour = date.diff(checkHour, "minutes").minutes;
                        // console.log(ihour, hour.hour, date, checkHour);
                        if (ihour < 120 && ihour >= 0) {
                            hour.checks.push(sc);
                            found = true;
                        }
                    }
                    if (!found) {
                        checksDates[date.toISODate()].checks.push(sc);
                    }
                }
            }
        }
        // console.log(filteredTags)
        console.log(checksDates);
    }

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
        if (branchesUnsubscribe != null && branchesUnsubscribe != undefined) {
            branchesUnsubscribe();
            branchesUnsubscribe = undefined;
        }
    });

    if (profileFilter !== null) {
        unsubscribeProfile = profile.subscribe((value) => {
            if (value == undefined && !$permissions.admin) {
                console.log("no profile");
                return;
            }
            if (!$permissions.admin && !$permissions.supervision_tags_check) {
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
        datatable = jQuery("#supervision_tags_check-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                [
                    "10 Historial de revisiones",
                    "25 Historial de revisiones",
                    "50 Historial de revisiones",
                    "Todo",
                ],
            ],
            data: supervision_tags_check,
            createdRow: function (row, data, index) {},
            columns: [
                {
                    data: "added",
                    name: "Fecha",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        var date = DateTime.fromJSDate(data.toDate()).setLocale(
                            "es-mx",
                        );
                        return type == "sort"
                            ? date.toISODate()
                            : html(
                                  '<a href="#/editsupervision_tags_check/' +
                                      id +
                                      '">' +
                                      date.toLocaleString(
                                          DateTime.DATE_MED_WITH_WEEKDAY,
                                      ) +
                                      "</a>",
                              );
                    },
                },
                {
                    data: "supervision_tagsName",
                    name: "Punto de revisión",
                    width: "auto",
                },
                { data: "branchesName", name: "Estancia", width: "auto" },
                { data: "usersName", name: "Revisado por", width: "auto" },
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
                                    '<a href="#/editsupervision_tags_check/' +
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
            .appendTo("#supervision_tags_check-dt_wrapper .col-md-6:eq(0)");
    }
    function loadFirebaseData() {
        let query = db
            .collection("supervision_tags_check")
            .where("added", ">=", last4Weeks.toJSDate())
            .where("added", "<=", today.plus({ days: 1 }).toJSDate());
        if (filterName != undefined && filterValue != undefined) {
            console.log("filter : " + filterName + " == " + filterValue);
            query = query.where(filterName, "==", filterValue);
        }

        unsubscribe = query
            .orderBy("added", "desc")
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];

                querySnapshot.forEach((doc) => {
                    // console.log(`${doc.id} => ${doc.data()}`);
                    const tempsupervision_tags_check = doc.data();
                    tempsupervision_tags_check.id = doc.id;
                    tempsupervision_tags_check.did = doc.id;

                    tempsupervision_tags_check.supervision_tagsName = "";
                    $supervision_tags.forEach((elsupervision_tags) => {
                        if (
                            elsupervision_tags.id ==
                            tempsupervision_tags_check.supervision_tags
                        ) {
                            tempsupervision_tags_check.supervision_tagsName =
                                elsupervision_tags.name;
                        }
                    });

                    tempsupervision_tags_check.branchesName = "";
                    $branches.forEach((elbranches) => {
                        if (
                            elbranches.id == tempsupervision_tags_check.branches
                        ) {
                            tempsupervision_tags_check.branchesName =
                                elbranches.name;
                        }
                    });

                    tempsupervision_tags_check.usersName = "";
                    $users.forEach((elusers) => {
                        if (elusers.id == tempsupervision_tags_check.users) {
                            tempsupervision_tags_check.usersName = elusers.name;
                        }
                    });

                    tmp.push(tempsupervision_tags_check);
                });
                supervision_tags_check = tmp;
                // await tick();
                // if(datatable == undefined){

                //     loadData();
                // }else{
                //     datatable.clear();
                //     datatable.rows.add(supervision_tags_check).draw(false);
                // }
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
                db.collection("supervision_tags_check").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("supervision_tags_check").doc(id).update(update);
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
    <TitleBar title="Historial de revisiones" base="Inventario" />
    <div class="">
        <p>
            <BranchesSearchList bind:value={filterValue} inlist={!hasEdit} />
        </p>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">
                        Administración Historial de revisiones
                    </h4>

                    {#if filterName != undefined && filterValue != undefined}
                        <FilterName
                            node={profileFilter != null
                                ? profileFilter[1]
                                : filterName}
                            value={filterValue}
                        />
                    {/if}
                    <div class="form-group row">
                        <label for="date" class="col-md-4 col-form-label"
                            >Ver:
                        </label>
                        <div class="col-md-8">
                            <button
                                on:click={() => (view = 0)}
                                class="btn {view == 0
                                    ? 'btn-primary'
                                    : ' btn-secondary'}">Revisiones</button
                            >
                            <button
                                on:click={() => (view = 1)}
                                class="btn {view == 1
                                    ? 'btn-primary'
                                    : ' btn-secondary'}">Cumplimiento</button
                            >
                        </div>
                    </div>
                    <hr />
                    {#if view == 0}
                        <table
                            id="supervision_tags_check-dt"
                            class="table table-striped table-bordered dt-responsive nowrap"
                            style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                        >
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Punto de revisión</th>
                                </tr>
                            </thead>

                            <tbody>
                                {#if branch != undefined}
                                    {#if branch.night == undefined}
                                        <h5>
                                            Esta estancia no tiene horarios
                                            definidos
                                        </h5>
                                    {:else}
                                        {#each Object.entries(checksDates) as cdate}
                                            <tr>
                                                <td
                                                    >{cdate[1].date.toLocaleString(
                                                        DateTime.DATE_MED_WITH_WEEKDAY,
                                                    )}</td
                                                >
                                                <td>
                                                    {#each cdate[1].hours as hour}
                                                        <TagsCheck
                                                            {tags}
                                                            hour={hour.hour}
                                                            checks={hour.checks}
                                                        />
                                                    {/each}
                                                    {#if cdate[1].checks.length > 0}
                                                        <div class="col">
                                                            Fuera de horario: {cdate[1]
                                                                .checks.length}
                                                        </div>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {:else}
                                            <h5>
                                                Esta estancia no tiene
                                                revisiones realizadas
                                            </h5>
                                        {/each}
                                    {/if}
                                {/if}
                            </tbody>
                        </table>
                    {:else}
                        <table
                            id="supervision_tags_check-dt"
                            class="table table-striped table-bordered dt-responsive nowrap"
                            style="border-collapse: collapse; border-spacing: 0; width: 100%; display:block; overflow:auto;"
                        >
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Completado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {#if branch != undefined}
                                    {#if branch.night == undefined}
                                        <h5>
                                            Esta estancia no tiene horarios
                                            definidos
                                        </h5>
                                    {:else}
                                        {#each Object.entries(completed) as cdate}
                                            {@const dayId =
                                                cdate[1].date.toISODate()}
                                            {#if checksDates[dayId] != undefined}
                                                <tr>
                                                    <td
                                                        >{cdate[1].date.toLocaleString(
                                                            DateTime.DATE_MED_WITH_WEEKDAY,
                                                        )}</td
                                                    >
                                                    <td
                                                        style="display: flex; flex-direction:row; "
                                                    >
                                                        {#each checksDates[dayId].hours as hour}
                                                            <TagsCompleted
                                                                {tags}
                                                                hour={hour.hour}
                                                                checks={hour.checks}
                                                            />
                                                        {/each}
                                                    </td>
                                                </tr>
                                            {:else}
                                                <tr>
                                                    <td
                                                        >{cdate[1].date.toLocaleString(
                                                            DateTime.DATE_MED_WITH_WEEKDAY,
                                                        )}</td
                                                    >
                                                    <td>
                                                        <h5
                                                            class="error percentage"
                                                        >
                                                            0%
                                                        </h5>
                                                    </td>
                                                </tr>
                                            {/if}
                                        {:else}
                                            <h5>
                                                Esta estancia no tiene
                                                revisiones realizadas
                                            </h5>
                                        {/each}
                                    {/if}
                                {/if}
                            </tbody>
                        </table>
                    {/if}
                </div>
            </div>
        </div>
        <!-- end col -->
    </div>
    <!-- end row -->
</div>

<!--
    {#each supervision_tags_check as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            <td><h5>{row.supervision_tagsName}</h5></td>
<td><h5>{row.branchesName}</h5></td>
<td><h5>{row.usersName}</h5></td>

                            <td>
                                {#if hasEdit}
                                    {#if modal}
                                    <button type="button" class="btn btn-light waves-effect" on:click={()=>{ setEditId(row.id);}}><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>
                                    {:else}
                                     <a href="/editsupervision_tags_check/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                                    {/if}
                                {/if}
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>
                            </td>
                        </tr>
                        {/each}
-->
<style>
    .error {
        color: red;
    }
    .percentage {
        font-size: 30px;
        font-weight: bold;
        margin: 0;
        width: 100px;
        height: 100px;
        text-align: center;
    }
</style>
