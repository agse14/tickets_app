<script>
    export let config = { search: false };
    import {fbuser, permissions, openMenu} from "./stores.js";

    console.log($fbuser, $permissions);
    let tickets = [];
    let lenght;

    $: getNotification();

    function logout(){
        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            console.log("Successful logout")
        }).catch(function(error) {
            // An error happened.
            console.log("Error at logout")
        });
    }

    function getNotification(){
        let query = db.collection("tickets")
        .where('status',"==",0)
        .orderBy('createdDate','desc')
        .onSnapshot((result) => {
            // console.log(result)
            tickets = [];
            // console.log(query)
            result.forEach((doc) => {
                const tempticket = doc.data();
                tempticket.id = doc.id;
                // console.log(tempticket.type);
                tickets.push(tempticket);
                // console.log(tickets);
                // console.log(tickets.length);
                lenght = tickets.lenght;
            });    
        });
    }

    function toggleMenu() {
        window.document.body.classList.toggle('sidebar-enable');
        //openMenu.set(true);
        openMenu.update(n => !n);
    }
</script>
<header id="page-topbar">
    <div class="navbar-header">
        <div class="container-fluid">
            <div class="float-right">
                {#if config.search}
                
                <div class="dropdown d-inline-block d-lg-none ml-2">
                    <button type="button" class="btn header-item noti-icon waves-effect" id="page-header-search-dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="mdi mdi-magnify"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right p-0" aria-labelledby="page-header-search-dropdown">

                        <form class="p-3">
                            <div class="form-group m-0">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Search ..." aria-label="Recipient's username">
                                    <div class="input-group-append">
                                        <button class="btn btn-primary" type="submit"><i class="mdi mdi-magnify"></i></button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                {/if}

                <!-- <div class="dropdown d-none d-lg-inline-block ml-1">
                    <button type="button" class="btn header-item noti-icon waves-effect" data-toggle="fullscreen">
                        <i class="mdi mdi-fullscreen"></i>
                    </button>
                </div> -->

                <div class="dropdown d-inline-block">
                    <button type="button" class="btn header-item noti-icon waves-effect" id="page-header-notifications-dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="mdi mdi-bell-outline"></i>
                        {#if lenght == undefined}
                            <span class="badge badge-secondary badge-pill">0</span>    
                        {:else}
                            <span class="badge badge-danger badge-pill">{lenght}</span>
                        {/if}
                    </button>
                    <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right p-0" aria-labelledby="page-header-notifications-dropdown">
                        <div class="p-3">
                            <div class="row align-items-center">
                                <div class="col">
                                    <h6 class="m-0"> Notificaciones </h6>
                                </div>
                                <div class="col-auto">
                                    <a href="#/tickets" class="small">Ver Todas</a>
                                </div>
                            </div>
                        </div>
                        {#each Object.keys(tickets) as ticket}
                            <a href="#/notifyadmin" class="text-reset notification-item">
                                <div data-simplebar>
                                    <div class="media">
                                        <div class="avatar-xs mr-3">
                                            <span class="avatar-title bg-warning rounded-circle font-size-16">
                                                <i class="bx bx-info-circle"></i>
                                            </span>
                                        </div>
                                        <div class="media-body" href="#/notifyadmin">
                                            <h6 class="mt-0 mb-1">{tickets[ticket].type}</h6>
                                            <div class="font-size-12 text-muted">
                                                <p class="mb-1">{tickets[ticket].branchesName} - {tickets[ticket].workerName}</p>
                                                <!-- <p class="mb-0"><i class="mdi mdi-clock-outline"></i> 3 min ago</p> -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        {/each}
                        <div class="p-2 border-top">
                            <a class="btn btn-sm btn-link font-size-14 btn-block text-center" href="javascript:void(0)">
                                <i class="mdi mdi-arrow-right-circle mr-1"><a href="#/tickets">Ver Mas...</a></i> 
                            </a>
                        </div>
                    </div>
                </div>

                <div class="dropdown d-inline-block">
                    <button type="button" class="btn header-item waves-effect" id="page-header-user-dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <img class="rounded-circle header-profile-user" src="assets/images/users/avatar-2.jpg" alt="Header Avatar">
                        <span class="d-none d-xl-inline-block ml-1">{$fbuser != null ? $fbuser.displayName:''}</span>
                        <i class="mdi mdi-chevron-down d-none d-xl-inline-block"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-right">
                        <!-- item-->
                        <a class="dropdown-item" href="#"><i class="bx bx-user font-size-16 align-middle mr-1"></i> Perfil</a>
                        <a class="dropdown-item d-block" href="#"><span class="badge badge-success float-right">11</span><i class="bx bx-wrench font-size-16 align-middle mr-1"></i> Settings</a>
                        <a class="dropdown-item" href="#"><i class="bx bx-lock-open font-size-16 align-middle mr-1"></i> Lock screen</a>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item text-danger"  on:click={logout} href="/index.html"><i class="bx bx-power-off font-size-16 align-middle mr-1 text-danger"></i> Salir</a>
                    </div>
                </div>

            </div>
            <div>
                <!-- LOGO -->
                <div class="navbar-brand-box">
                    <a href="index.html" class="logo logo-dark">
                        <span class="logo-sm">
                            <img src="assets/images/logo-w.png" alt="" height="50">
                        </span>
                        <span class="logo-lg">
                            <img src="assets/images/logo-dark.png" alt="" height="50">
                        </span>
                    </a>

                    <a href="index.html" class="logo logo-light">
                        <span class="logo-sm">
                            <img src="assets/images/logo-w.png" alt="" height="50">
                        </span>
                        <span class="logo-lg">
                            <img src="assets/images/logo-w.png" alt="" height="50">
                        </span>
                    </a>
                </div>

                <button type="button" class="btn btn-sm px-3 font-size-16 header-item toggle-btn waves-effect" id="vertical-menu-btn" on:click={toggleMenu}>
                    <i class="fa fa-fw fa-bars"></i>
                </button>
                {#if config.search}
                <!-- App Search-->
                <form class="app-search d-none d-lg-inline-block">
                    <div class="position-relative">
                        <input type="text" class="form-control" placeholder="Search...">
                        <span class="bx bx-search-alt"></span>
                    </div>
                </form>
                {/if}
                
            </div>

        </div>
    </div>
</header> <!-- ========== Left Sidebar Start ========== -->
<style>
/* Sober professional top bar palette */
#page-topbar {
    background: #1f2937; /* slate-800 */
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: #e5e7eb; /* neutral-200 */
}

.navbar-header {
    padding: 12px 20px;
}

.header-item {
    color: #e6eef8; /* light text */
    background: transparent;
    border: none;
    padding: 6px 8px;
    transition: background 150ms ease, transform 120ms ease;
    border-radius: 8px;
}
.header-item:hover {
    background: rgba(255,255,255,0.03);
    transform: translateY(-1px);
}

.app-search {
    margin-left: 14px;
}
.app-search .form-control {
    height: 36px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.04);
    padding-left: 12px;
    padding-right: 36px;
    box-shadow: none;
    color: #e6eef8;
}
.app-search .bx-search-alt {
    position: absolute;
    right: 12px;
    top: 8px;
    color: rgba(230,238,248,0.54);
}

.noti-icon {
    position: relative;
}
.noti-icon .badge,
.topbar-badge,
.badge-pill {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    font-size: 11px;
    padding: 0 6px;
    border-radius: 999px;
    background: #f59e0b; /* amber-500 */
    color: #111827; /* dark text for contrast */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 18px rgba(2,6,23,0.28);
}

.header-profile-user {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.06);
    box-shadow: 0 6px 18px rgba(2,6,23,0.2);
}

.navbar-brand-box .logo img {
    height: 36px;
    filter: brightness(0) invert(1) saturate(0.6);
}

.navbar-brand-box .brand-name {
    font-weight: 600;
    margin-left: 8px;
    color: #e6eef8;
}

.dropdown-menu {
    border-radius: 12px;
    border: 1px solid rgba(16,24,40,0.06);
    box-shadow: 0 8px 32px rgba(2,6,23,0.08);
}

.mdi, .bx {
    color: rgba(230,238,248,0.85);
}

@media (max-width: 767px) {
    .navbar-header { padding: 10px 12px; }
    .app-search { display: none; }
}
</style>