<script>
    import TitleBar from "../TitleBar.svelte";
    import { permissions } from "../stores.js";

    let notifications = [];
    let showModal = false;
    let loading = false;
    let editData = {};

    $: getNotification();

    function getNotification(){
        db.collection("adminnotifications")
        .get()
        .then(async (querySnapshot) => { 
    
        notifications = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(doc.data());
                const tempnotification = doc.data();
                tempnotification.id = doc.id;
                // console.log(tempnotification.type);
                notifications.push(tempnotification);
                // console.log(notifications);
            });
        })
        console.log($permissions);
    }

    function edit(id, subject, status){
    console.log(id, subject, status);
    editData = {notId: id, subject:subject, status:status};
    showModal = true;
    updateStatus();
    jQuery('#editModalStatus').modal('show');   
    }

    function updateStatus() {
        var updateValue = {};
       
        updateValue["read"] = editData.status;        
    
        db.collection("adminnotifications")
            .doc(editData.notId)
            .update(updateValue)
            .then(function () {
            });

    jQuery('#editModalStatus').modal('hide'); 
    }  
     
</script>
<div class="page-content">
    <TitleBar title="Centro de Notificaciones" base="Dashboard" />
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h3 style="text-align:center">Notificaciones</h3>
                    <table id='table' class="table table-striped print-no-break mb-4 mt-4">
                        <thead>
                            <tr>
                                <th scope="row" style="text-align: center;">Empleado </th>
                                <th scope="row" style="text-align: center;">Estancia </th>
                                <th scope="row" style="text-align: center;">Motivo </th>
                                <th scope="row" style="text-align: center;">Fecha </th>
                                <th class="no-print" style="text-align: center;">Info</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each notifications as notification}
                                {#if notification.read == false}
                                    <tr style="height:50px;">
                                        <th scope="row read" style="text-align: center; height:50%;">{notification.workerName}</th>
                                        <th style="text-align: center;">{notification.branchesName}</th>
                                        <th scope="row" style="text-align: center;">{notification.type}</th>
                                        <th scope="row" style="text-align: center;">{notification.absenceDate}</th>
                                        <th scope="row" style="text-align: center;">
                                            <button type="button" class="btn btn-outline-success waves-effect waves-light" on:click={() => {edit(notification.id,notification.subject,true)}}><i class="bx bx-info-circle font-size-16 align-middle"></i></button>
                                        </th>
                                    </tr>
                                {:else}
                                    <tr style="height:50px;">
                                        <td scope="row" style="text-align: center; height:50%;">{notification.workerName}</td>
                                        <td style="text-align: center;">{notification.branchesName}</td>
                                        <td scope="row" style="text-align: center;">{notification.type}</td>
                                        <td scope="row" style="text-align: center;">{notification.absenceDate}</td>
                                        <td scope="row" style="text-align: center;">
                                            <button type="button" class="btn btn-outline-success waves-effect waves-light" on:click={() => {edit(notification.id,notification.subject,true)}}><i class="bx bx-info-circle font-size-16 align-middle"></i></button>
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="editModalStatus" tabindex="-1" role="dialog" aria-labelledby="editModalStatusTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content" style="overflow-y: scroll;">
                <div class="modal-header">
                    <h5 class="modal-title mt-0" id="editModalStatusTitle">Información</h5>
                    <button type="button" class="close" on:click={()=>{
                        editData = {};
                        jQuery('#editModalStatus').modal('hide');
                        showModal = false;
                        }} aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                {#if showModal}
                    <div class="row text mb-2">
                        <div class="col-12">
                            <span style="text-align: center;">{editData.subject}</span> 
                        </div>
                    </div>
                {/if}
                <div class="row modal-footer" style="height: 80px">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-body" style="text-align: center;">
                                <button
                                    on:click={()=>{
                                        getNotification();
                                        editData = {};
                                        jQuery('#editModalStatus').modal('hide');
                                        showModal = false;
                                        }}
                                    class="btn btn-primary waves-effect waves-light"
                                    disabled={loading}>
                                Ok</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .table th {
        padding: 0.1rem;
        vertical-align: middle;
        border-top: 1px solid #eff2f7;
        font-weight: 500;
    }
    .table td {
        padding: 0.1rem;
        vertical-align: middle;
        border-top: 1px solid #eff2f7;
        font-weight: 300;
    }
    .row.text {
        padding: 1.75rem;
        text-align: center;
        font-size: large;
    }
</style>
