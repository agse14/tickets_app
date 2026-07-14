<script>
	import { tick } from "svelte";
	import { get } from 'svelte/store';
	import Footer from "./Footer.svelte";
	import Sidebar from "./Sidebar.svelte";
	import TopBar from "./TopBar.svelte";
	import Router from "svelte-spa-router";
	import {location} from "svelte-spa-router";
	import { routes } from "./menu";
	import ListSelect from "./ListSelect.svelte";
	import Login from "./Login.svelte";
	import { fbuser, permissions, profile } from "./stores.js";
    import IncidentEdit from "./pages/IncidentEdit.svelte";
	import { link, push } from "svelte-spa-router";
	export let name;

	let userTemp;
	let checkingUser = true;
	let emailTemp;

	firebase.auth().onAuthStateChanged(async function (user) {
		checkingUser = false;
		if (user) {
			console.log("User is signed in.", user);
			var displayName = user.displayName;
			var email = user.email;
			var emailVerified = user.emailVerified;
			var photoURL = user.photoURL;
			var isAnonymous = user.isAnonymous;
			var uid = user.uid;
			var providerData = user.providerData;
			userTemp = user;
			emailTemp = email;
			fbuser.set(user);
			//console.log("User " + emailTemp + " is logged in." +user.uid);
			let query = db
				.collection("users")
				.doc(uid)
				.get()
				.then(function (query) {
					if (
						query == null ||
						query == undefined ||
						query.data() == null
					) {
						//No profile
						//pop();
					} else {
						console.log("Got profile", query.data());
						profile.set(query.data());
					}
				});
			firebase
				.auth()
				.currentUser.getIdTokenResult()
				.then((idTokenResult) => {
					// Confirm the user is an Admin.
					// Debug: print claims so we can see what's coming from the token
					console.log('idTokenResult.claims ->', idTokenResult.claims);
					console.log('currentUser uid ->', firebase.auth().currentUser ? firebase.auth().currentUser.uid : null);
					permissions.set(idTokenResult.claims);

					// If there are no custom claims in the token (empty object), try to fall back
					// to permissions stored on the user's profile document in Firestore.
					if (!idTokenResult.claims || Object.keys(idTokenResult.claims).length === 0) {
						const p = get(profile);
						if (p) {
							// If profile has an explicit permissions object, use it.
							if (p.permissions) {
								permissions.set(p.permissions);
							} else {
								// Otherwise derive some common flags if present on the profile
								const inferred = {};
								if (p.admin) inferred.admin = true;
								if (p.tickets) inferred.tickets = true;
								if (p.admin_branch) inferred.admin_branch = true;
								// only set if we inferred something
								if (Object.keys(inferred).length > 0) permissions.set(inferred);
							}
						}
					}
					// console.log(idTokenResult.claims);
					/*if (!!idTokenResult.claims.admin) {
			// Show admin UI.
			showAdminUI();
			} else {
			// Show regular user UI.
			showRegularUI();
			}*/
				})
				.catch((error) => {
					console.log(error);
				});
			/*await tick();
		setTimeout(function(){
			console.log("User is signed in.",user);

			jQuery("#vertical-menu-btn").on("click",function(e){e.preventDefault(),jQuery("body").toggleClass("sidebar-enable"),992<=jQuery(window).width()?jQuery("body").toggleClass("vertical-collpsed"):jQuery("body").removeClass("vertical-collpsed")});
		}, 500);*/

			// ...
		} else {
			// User is signed out.
			// ...
			console.log("User not logged");
		}
	});
</script>

<svelte:head>
	<script src="assets/js/app.js"></script>
</svelte:head>

{#if userTemp != null}
	<div class="container-fluid">
		<!-- Begin page -->
		<div id="layout-wrapper">
			<TopBar />
			<div class="vertical-menu">
				<div class="h-100" style="overflow: auto;">
					<div class="user-wid text-center py-4">
						<div class="user-img">
							<img
								src="assets/images/users/avatar-2.jpg"
								alt=""
								class="avatar-md mx-auto rounded-circle"
							/>
						</div>

						<div class="mt-3">
							<a
								href="#"
								class="text-dark font-weight-medium font-size-16"
								>{$fbuser != null ? $fbuser.displayName : ""}</a
							>
							<p class="text-body mt-1 mb-0 font-size-13">
								{#if $permissions.admin}Administrador{:else}Usuario{/if}
							</p>
						</div>
					</div>

					<Sidebar />
				</div>
			</div>
			<!-- Left Sidebar End -->

			<!-- ============================================================== -->
			<!-- Start right Content here -->
			<!-- ============================================================== -->
			<div class="main-content">
				<Router {routes} />
				<Footer />
			</div>
			<!-- end main content-->
		</div>
		<!-- END layout-wrapper -->
	</div>
	<!-- end container-fluid -->
{:else}
	{@const loc = $location.split("/")}
	{@const isIncident = loc.length > 0 && loc[1] == "publicincident"}
	{@const isTanks = loc.length > 0 && loc[1] == "gracias"}
	{#if isIncident}
		<div style="display: flex; justify-content: center;align-items: center; width: 100%; height:100vh; font-size:large;flex-direction: column; padding-top:50px; " class="center">
			<p><img src="assets/images/logo-sm.png" alt="" height="100"></p>
			<IncidentEdit params={{tid:0,field:"branches",value:loc[2]}} onBack={()=>{push("/gracias");}} hideTitle={true} />
		</div>
	{:else if isTanks}
	   <div style="display: flex; justify-content: center;align-items: center; width: 100%; height:100vh; font-size:large;flex-direction: column; " class="center">
		<p><img src="assets/images/logo-sm.png" alt="" height="130"></p>
		<p>Gracias por enviar su reporte en breve nos comunicaremos con usted</p></div>
	{:else}
		<Login />
	{/if}
{/if}

<style>
	.main-content {
		overflow: auto; /* Opciones: visible | hidden | scroll | auto */
	}
</style>
