<script>
	import { link } from "svelte-spa-router";
	import { pop } from "svelte-spa-router";
	import { fbuser, permissions } from "../stores.js";
	import TitleBar from "../TitleBar.svelte";
	import { onMount } from "svelte";

	import Activities_advancedOptions from "../controls/Activities_advancedOptions.svelte";
	import Activities_auxOptions from "../controls/Activities_auxOptions.svelte";
	import Activities_basicOptions from "../controls/Activities_basicOptions.svelte";
	import Activities_generalOptions from "../controls/Activities_generalOptions.svelte";
	import { branches } from "../controls/branches.js";
	import BranchesSearchList from "../controls/BranchesSearchList.svelte";
	import PartnersCivilListSelect from "../controls/PartnersCivilListSelect.svelte";
	import PartnersContact_relationListSelect from "../controls/PartnersContact_relationListSelect.svelte";
	import PartnersContact_relation_2ListSelect from "../controls/PartnersContact_relation_2ListSelect.svelte";
	import PartnersContact_relation_3ListSelect from "../controls/PartnersContact_relation_3ListSelect.svelte";
	import PartnersContact_relation_emeListSelect from "../controls/PartnersContact_relation_emeListSelect.svelte";
	import Docs_containsOptions from "../controls/Docs_containsOptions.svelte";
	import ImageField from "../controls//ImageField.svelte";
	import PartnersGenderListSelect from "../controls/PartnersGenderListSelect.svelte";
	import HabitsOptions from "../controls/HabitsOptions.svelte";
	import PartnersPaymentperiodListSelect from "../controls/PartnersPaymentperiodListSelect.svelte";
	import PartnersPayrollListSelect from "../controls/PartnersPayrollListSelect.svelte";
	import { positions } from "../controls/positions.js";
	import PositionsSearchList from "../controls/PositionsSearchList.svelte";
	import PartnersStudyListSelect from "../controls/PartnersStudyListSelect.svelte";
	import PartnersTypeListSelect from "../controls/PartnersTypeListSelect.svelte";

	function checkVisibles() {
		if (!values.active_service != !old.active_service) {
			if (!!values.active_service && old.active_date_off != undefined) {
				values.active_date_off = firebase.firestore.FieldValue.delete();
			}
		}
		if (!values.active_service != !old.active_service) {
			if (!!values.active_service && old.active_reason != undefined) {
				values.active_reason = firebase.firestore.FieldValue.delete();
			}
		}
		if (
			(values.type == 0 || values.type == 1) !=
			(old.type == 0 || old.type == 1)
		) {
			if (
				!(values.type == 0 || values.type == 1) &&
				old.activities_advanced != undefined
			) {
				values.activities_advanced =
					firebase.firestore.FieldValue.delete();
			}
		}
		if ((values.type == 2) != (old.type == 2)) {
			if (!(values.type == 2) && old.activities_aux != undefined) {
				values.activities_aux = firebase.firestore.FieldValue.delete();
			}
		}
		if (
			(values.type == 0 || values.type == 1) !=
			(old.type == 0 || old.type == 1)
		) {
			if (
				!(values.type == 0 || values.type == 1) &&
				old.activities_basic != undefined
			) {
				values.activities_basic =
					firebase.firestore.FieldValue.delete();
			}
		}
		if (values.inbranch != old.inbranch) {
			if (!values.inbranch && old.branches != undefined) {
				values.branches = firebase.firestore.FieldValue.delete();
			}
		}
		if (values.disease != old.disease) {
			if (!values.disease && old.disease_comments != undefined) {
				values.disease_comments =
					firebase.firestore.FieldValue.delete();
			}
		}
		if (values.active != old.active) {
			if (!values.active && old.password != undefined) {
				values.password = firebase.firestore.FieldValue.delete();
			}
		}
		if (values.inbranch != old.inbranch) {
			if (!values.inbranch && old.pay != undefined) {
				values.pay = firebase.firestore.FieldValue.delete();
			}
		}
		if (values.inbranch != old.inbranch) {
			if (!values.inbranch && old.paymentperiod != undefined) {
				values.paymentperiod = firebase.firestore.FieldValue.delete();
			}
		}
		if (values.inbranch != old.inbranch) {
			if (!values.inbranch && old.payroll != undefined) {
				values.payroll = firebase.firestore.FieldValue.delete();
			}
		}
		if (values.inbranch != old.inbranch) {
			if (!values.inbranch && old.positions != undefined) {
				values.positions = firebase.firestore.FieldValue.delete();
			}
		}
		if (
			(values.study == 4 || values.study == 5 || values.study == 6) !=
			(old.study == 4 || old.study == 5 || old.study == 6)
		) {
			if (
				!(
					values.study == 4 ||
					values.study == 5 ||
					values.study == 6
				) &&
				old.study_name != undefined
			) {
				values.study_name = firebase.firestore.FieldValue.delete();
			}
		}
	}

	export let params = {};
	export let values = {};
	export let autoAdd = false;
	export let buttons = true;
	export let onBack = () => {
		pop();
	};

	let old = {};
	let adder = {};
	let exists = false;

	let loading = true;
	let form;

	let filterName = params.field;
	let filterValue = params.value;

	let showHistory = false;
	let showPayHistory = false;

	const tempId = params.bid;
	if (filterName != undefined && filterValue != undefined) {
		//console.log("filter : "+filterName+" == "+filterValue)
		values[filterName] = filterValue;
	}

	onMount(() => {
		form = document.getElementById("form");
		var defaultOptions = {};

		// touchspin
		jQuery('[data-toggle="touchspin"]').each(function (idx, obj) {
			var objOptions = jQuery.extend(
				{},
				defaultOptions,
				jQuery(obj).data()
			);
			jQuery(obj)
				.TouchSpin(objOptions)
				.on("change", function () {
					//this.value
					newResidents = this.value;
				});
		});
		jQuery(".input-mask").inputmask();
		if (tempId == null) {
			loading = false;
		} else {
			db.collection("partners")
				.doc(tempId)
				.get()
				.then(function (query) {
					if (
						query == null ||
						query == undefined ||
						query.data() == null
					) {
						//No data crear
						//pop();
					} else {
						exists = true;
						values = query.data();
						old = query.data();
					}
					loading = false;
				});
		}
	});

	function cancel() {
		onBack();
	}

	function validateFields() {
		if (!values.name || values.name.trim() === "") {
			Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debes ingresar el nombre.' });
			return false;
		}
		if (!values.lastname || values.lastname.trim() === "") {
			Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debes ingresar el apellido paterno.' });
			return false;
		}
		if (!values.birth || values.birth === "") {
			Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debes ingresar la fecha de nacimiento.' });
			return false;
		}
		if (!values.isMinor) {
			if (!values.imss || values.imss.trim() === "") {
				Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debes ingresar el IMSS.' });
				return false;
			}
			if (!values.rfc || values.rfc.trim() === "") {
				Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debes ingresar el RFC.' });
				return false;
			}
		}
		if (values.active && (!values.password || values.password.trim() === "")) {
			Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debes ingresar la contraseña de acceso.' });
			return false;
		}
		return true;
	}

	function updateData() {
		if (!validateFields()) return;
		if (!form.checkValidity()) {
			form.reportValidity();
			/*
        jQuery(".tab-pane").length
        for(var elem of form.elements){
          if(!elem.checkValidity()){ 
            $('.nav-tabs a[href="#personal-tab"]').tab('show');
            form.reportValidity();
            console.log(elem);
          }
        };
      */
			return;
		}
		if (checkVisibles != undefined) {
			checkVisibles();
		}
		loading = true;

		if (tempId != null) {
			//Actualizar si tiene id
			if (!exists) {
				values.added = timenow;
				db.collection("partners")
					.doc(tempId)
					.set(values)
					.then(function () {
						loading = false;
						onBack();
					});
			} else {
				// Obtener el valor anterior del campo reentry_date
				let previousReentryDate = old.reentry_date;

				// Obtener el nuevo valor del campo reentry_date
				let newReentryDate = values.reentry_date;

				// Comparar con el valor anterior
				if (newReentryDate !== previousReentryDate) {
					// Solo si hay un cambio, incrementar el contador de ediciones
					values.editCount = (values.editCount || 0) + 1;
					console.log(values.editCount);
				}

				// --- HISTORIAL DE CAMBIOS EN PAGO POR TURNO ---
				if (values.pay !== old.pay) {
					if (!Array.isArray(values.payHistory)) {
						values.payHistory = [];
					}
					values.payHistory.push({
						previousPay: old.pay || 0,
						newPay: values.pay || 0,
						changeDate: new Date(),
						changedBy: $fbuser.uid,
						changedByName: $fbuser.displayName ?? "",
						reason: `Cambio de pago: $${old.pay || 0} → $${values.pay || 0}`
					});
					console.log('Pay change logged:', {
						from: old.pay,
						to: values.pay,
						by: $fbuser.displayName
					});
				}

				// --- HISTORIAL DE EDICIONES ---
				if (!Array.isArray(values.history)) {
					values.history = [];
				}
				values.history.push({
					edited: new Date(),
					editedBy: $fbuser.uid,
					editedByName: $fbuser.displayName ?? ""
				});
				// -----------------------------

				values.edited = timenow;
				db.collection("partners")
					.doc(tempId)
					.update(values)
					.then(function () {
						loading = false;
						onBack();
					});
			}
		} else {
			// Crear nuevo si no tiene
			values.added = timenow;
			values.editCount = 0;
			values.previousReentryDate = '';
			values.createdBy = $fbuser.uid;
			values.createdName = $fbuser.displayName ?? "";

			const inputName = values.name.trim().toLowerCase();
			const inputLastname = values.lastname.trim().toLowerCase();

			db.collection("partners")
				.get()
				.then((querySnapshot) => {
					let isDuplicate = false;
					let matchedRecord = null;

					const inputName = values.name.trim().toLowerCase();
					const inputLastname = values.lastname.trim().toLowerCase();

					for (const doc of querySnapshot.docs) {
					const data = doc.data();
					const dbName = data.name?.trim().toLowerCase() || "";
					const dbLastname = data.lastname?.trim().toLowerCase() || "";

					if (!dbName || !dbLastname) continue;

					const nameMatch = dbName.includes(inputName) || inputName.includes(dbName);
					const lastnameMatch = dbLastname.includes(inputLastname) || inputLastname.includes(dbLastname);

					if (nameMatch && lastnameMatch) {
						console.log("Coincidencia encontrada:", data);
						isDuplicate = true;
						matchedRecord = data;
						break; // 💥 Detiene el bucle inmediatamente
					}
					}

					if (isDuplicate) {
					Swal.fire({
						title: 'Posible duplicado',
						html: `Se detectó una posible coincidencia con: <strong>${matchedRecord.name} ${matchedRecord.lastname}</strong>. ¿Deseas continuar con el registro de <strong>${values.name} ${values.lastname}</strong>?`,
						icon: 'warning',
						showCancelButton: true,
						confirmButtonText: 'Sí, crear de todos modos',
						cancelButtonText: 'Cancelar'
					}).then((result) => {
						console.log(result);
						if (result.value) {
						db.collection("partners")
							.add(values)
							.then(function () {
							loading = false;
							onBack();
							});
						} else {
						loading = false;
						}
					});
					} else {
					db.collection("partners")
						.add(values)
						.then(function () {
						loading = false;
						onBack();
						});
					}
				});
		}
	}
	function setField(field, value) {
		values[field] = value;
		values = values;
	}

	function addToTable(field, adderValues) {
		if (values[field] == undefined) {
			values[field] = [];
		}
		values[field].push(adderValues);
		values = values;
		adder = {};
	}
	function deleteFromTable(field, idx) {
		if (values[field] != undefined) {
			values[field].splice(idx, 1);
		}
		values = values;
	}

	function onAction(event) {
		const action = event.detail;
		if (action == "save") {
			//console.log("saved");
			updateData();
		}
	}
</script>

<div class="page-content modal-body">
	<TitleBar title="Agregar Empleado" base="Inventario" />
	<form id="form">
		<div class="row">
			<div class="col-md-12 col-xl-4">
				<div class="card">
					<div class="card-body">
						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="active_serviceSwitch"
								bind:checked={values.active_service}
							/>
							<label
								class="custom-control-label"
								for="active_serviceSwitch">Activo</label
							>
						</div>
						<div class="form-group row">
							<label
								for="active_date"
								class="col-md-4 col-form-label"
								>Fecha de Alta</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.active_date}
									id="active_date"
								/>
							</div>
						</div>
						{#if !values.active_service}
							<div class="form-group row">
								<label
									for="active_date_off"
									class="col-md-4 col-form-label"
									>Fecha de baja</label
								>
								<div class="col-md-8">
									<input
										class="form-control"
										type="date"
										bind:value={values.active_date_off}
										id="active_date_off"
									/>
								</div>
							</div>
						{/if}{#if !values.active_service}
							<div class="form-group row">
								<label
									for="active_reason"
									class="col-md-4 col-form-label"
									>Razón de la Baja</label
								>
								<div class="col-md-8 input-group">
									<input
										class="form-control"
										type="text"
										bind:value={values.active_reason}
										id="active_reason"
									/>
								</div>
							</div>
						{/if}
						<div class="form-group row">
							<label
								for="reentry_date"
								class="col-md-4 col-form-label"
								>Fecha de Reingreso</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.reentry_date}
									id="reentry_date"
								/>
							</div>
						</div>
						<div class="form-group row">
							<label
								for="editCount"
								class="col-md-4 col-form-label"
								>Cantidad de Reingresos</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="number"
									bind:value={values.editCount}
									id="editCount"
									disabled
								/>
							</div>
						</div>
						<div class="form-group row">
							<label for="picture" class="col-12 col-form-label"
								>Foto</label
							>
							<div class="col-12">
								<ImageField
									bind:value={values.picture}
									node={values.id}
									baseId={"picture"}
									type={"file"}
									num={1}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="name" class="col-md-4 col-form-label"
								>Nombre</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.name}
									id="name"
									required
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="lastname"
								class="col-md-4 col-form-label"
								>Apellido Paterno</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.lastname}
									id="lastname"
									required
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="lastname_2"
								class="col-md-4 col-form-label"
								>Apellido Materno</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.lastname_2}
									id="lastname_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="email" class="col-md-4 col-form-label"
								>Email de acceso</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.email}
									id="email"
								/>
							</div>
						</div>

						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="activeSwitch"
								bind:checked={values.active}
							/>
							<label
								class="custom-control-label"
								for="activeSwitch">Activo en Medi</label
							>
						</div>
						{#if values.active}
							<div class="form-group row">
								<label
									for="password"
									class="col-md-4 col-form-label"
									>Contraseña de Acceso</label
								>
								<div class="col-md-8 input-group">
									<input
										class="form-control"
										type="text"
										bind:value={values.password}
										id="password"
										required
									/>
								</div>
							</div>
						{/if}
						<div class="form-group row">
							<label for="type" class="col-md-4 col-form-label"
								>Aplica a la posición de</label
							>
							<div class="col-md-4">
								<PartnersTypeListSelect
									bind:value={values.type}
									inlist={false}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Información del empleado</h3>

						<div class="form-group row">
							<label for="birth" class="col-md-4 col-form-label"
								>Fecha de nacimiento</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.birth}
									id="birth"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label class="col-md-4 col-form-label" for="minorSwitch">Menor de edad</label>
							<div class="col-md-8">
								<div class="custom-control custom-switch">
								<input
									type="checkbox"
									class="custom-control-input"
									id="minorSwitch"
									bind:checked={values.isMinor}
								/>
								<label class="custom-control-label" for="minorSwitch"></label>
								</div>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="birth_place"
								class="col-md-4 col-form-label"
								>Lugar de nacimiento</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.birth_place}
									id="birth_place"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="birth_contry"
								class="col-md-4 col-form-label"
								>Nacionalidad</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.birth_contry}
									id="birth_contry"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="curp" class="col-md-4 col-form-label"
								>CURP</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.curp}
									id="curp"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="imss" class="col-md-4 col-form-label"
								>IMSS</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.imss}
									id="imss"
									required={!values.isMinor}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="rfc" class="col-md-4 col-form-label"
								>RFC</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.rfc}
									id="rfc"
									required={!values.isMinor}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="gender" class="col-md-4 col-form-label"
								>Sexo</label
							>
							<div class="col-md-4">
								<PartnersGenderListSelect
									bind:value={values.gender}
									inlist={false}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="civil" class="col-md-4 col-form-label"
								>Estado Civil</label
							>
							<div class="col-md-4">
								<PartnersCivilListSelect
									bind:value={values.civil}
									inlist={false}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="study" class="col-md-4 col-form-label"
								>Nivel de estudios</label
							>
							<div class="col-md-4">
								<PartnersStudyListSelect
									bind:value={values.study}
									inlist={false}
								/>
							</div>
						</div>
						{#if values.study == 4 || values.study == 5 || values.study == 6}
							<div class="form-group row">
								<label
									for="study_name"
									class="col-md-4 col-form-label"
									>Carrera</label
								>
								<div class="col-md-8 input-group">
									<input
										class="form-control"
										type="text"
										bind:value={values.study_name}
										id="study_name"
									/>
								</div>
							</div>
						{/if}
						<div class="form-group row">
							<label for="height" class="col-md-4 col-form-label"
								>Altura (cm)</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="number"
									bind:value={values.height}
									id="height"
									step="0.01"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="weight" class="col-md-4 col-form-label"
								>Peso (kg)</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="number"
									bind:value={values.weight}
									id="weight"
									step="0.01"
								/>
							</div>
						</div>

						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="carSwitch"
								bind:checked={values.car}
							/>
							<label class="custom-control-label" for="carSwitch"
								>Tiene Auto</label
							>
						</div>
						<div class="form-group row">
							<label
								for="experience"
								class="col-md-4 col-form-label"
								>Experiencia comprobada (años)</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="number"
									bind:value={values.experience}
									id="experience"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Archivos</h3>

						<div class="form-group row">
							<div class="col-md-4 col-form-label">
								Contenido de archivo
							</div>
							<div class="col-md-8">
								<Docs_containsOptions
									bind:value={values.docs_contains}
								/>
							</div>
						</div>
						<div class="form-group row">
							<label
								for="docs_files"
								class="col-12 col-form-label"
								>Archivos Cargados</label
							>
							<div class="col-12">
								<ImageField
									bind:value={values.docs_files}
									node={values.id}
									baseId={"docs_files"}
									type={"file"}
									num={1}
								/>
							</div>
						</div>

						{#if $permissions.admin || $permissions.nominas || $permissions.hr}
							<h3>Trabajo en estancia</h3>

							<div
								class="custom-control custom-switch mb-2"
								dir="ltr"
							>
								<input
									type="checkbox"
									class="custom-control-input"
									id="inbranchSwitch"
									bind:checked={values.inbranch}
								/>
								<label
									class="custom-control-label"
									for="inbranchSwitch">En Estancia</label
								>
							</div>
							{#if values.inbranch}
								<div class="form-group row">
									<label
										for="#select-branches"
										class="col-md-4 col-form-label"
										>Sucursal</label
									>
									<div class="col-md-8">
										<BranchesSearchList
											bind:value={values.branches}
										/>
									</div>
								</div>
							
								<div class="form-group row">
									<label for="pay" class="col-md-4 col-form-label"
										>Pago por turno</label
									>
									<div class="col-md-8 input-group">
										<div class="input-group-prepend">
											<span class="input-group-text">$</span>
										</div>
										<input
											class="form-control input-mask"
											type="number"
											bind:value={values.pay}
											id="pay"
										/>
									</div>
								</div>
							
								<div class="form-group row">
									<label
										for="#select-positions"
										class="col-md-4 col-form-label"
										>Puesto</label
									>
									<div class="col-md-8">
										<PositionsSearchList
											bind:value={values.positions}
										/>
									</div>
								</div>
							
								<div class="form-group row">
									<label
										for="paymentperiod"
										class="col-md-4 col-form-label"
										>Período de Pago</label
									>
									<div class="col-md-4">
										<PartnersPaymentperiodListSelect
											bind:value={values.paymentperiod}
											inlist={false}
										/>
									</div>
								</div>

								{#if values.paymentperiod === 5}
									<div class="form-group row">
										<label for="projectDate" class="col-md-4 col-form-label">Fin del Proyecto</label>
										<div class="col-md-4">
											<input
												type="date"
												id="projectDate"
												class="form-control"
												bind:value={values.projectDate}
												placeholder="Seleccione la fecha del proyecto"
											/>
										</div>
									</div>
								{/if}
							
								<div class="form-group row">
									<label
										for="payroll"
										class="col-md-4 col-form-label"
										>Pago de Nómina</label
									>
									<div class="col-md-4">
										<PartnersPayrollListSelect
											bind:value={values.payroll}
											inlist={false}
										/>
									</div>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Dirección</h3>

						<div class="form-group row">
							<label for="home" class="col-md-4 col-form-label"
								>Teléfono de Casa</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.home}
									id="home"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="phone" class="col-md-4 col-form-label"
								>Teléfono Celular</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.phone}
									id="phone"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="address_block"
								class="col-md-4 col-form-label">Colonia</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.address_block}
									id="address_block"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="address_city"
								class="col-md-4 col-form-label"
								>Ciudad / Municipio</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.address_city}
									id="address_city"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="address_contry"
								class="col-md-4 col-form-label">País</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.address_contry}
									id="address_contry"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="address_street"
								class="col-md-4 col-form-label"
								>Calle y número</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.address_street}
									id="address_street"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="address_zip"
								class="col-md-4 col-form-label"
								>Código Postal</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.address_zip}
									id="address_zip"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Referencia 1</h3>

						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="contact_validSwitch"
								bind:checked={values.contact_valid}
							/>
							<label
								class="custom-control-label"
								for="contact_validSwitch"
								>Contacto validado</label
							>
						</div>
						<div class="form-group row">
							<label
								for="contact_name"
								class="col-md-4 col-form-label">Nombre</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_name}
									id="contact_name"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_relation"
								class="col-md-4 col-form-label"
								>Parentesco</label
							>
							<div class="col-md-4">
								<PartnersContact_relationListSelect
									bind:value={values.contact_relation}
									inlist={false}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_email"
								class="col-md-4 col-form-label">Email</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_email}
									id="contact_email"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_phone"
								class="col-md-4 col-form-label"
								>Teléfono fijo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_phone}
									id="contact_phone"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_cel"
								class="col-md-4 col-form-label">Celular</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_cel}
									id="contact_cel"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Referencia 2</h3>

						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="contact_valid_2Switch"
								bind:checked={values.contact_valid_2}
							/>
							<label
								class="custom-control-label"
								for="contact_valid_2Switch"
								>Contacto validado</label
							>
						</div>
						<div class="form-group row">
							<label
								for="contact_name_2"
								class="col-md-4 col-form-label">Nombre</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_name_2}
									id="contact_name_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_relation_2"
								class="col-md-4 col-form-label"
								>Parentesco</label
							>
							<div class="col-md-4">
								<PartnersContact_relation_2ListSelect
									bind:value={values.contact_relation_2}
									inlist={false}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_email_2"
								class="col-md-4 col-form-label">Email</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_email_2}
									id="contact_email_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_phone_2"
								class="col-md-4 col-form-label"
								>Teléfono fijo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_phone_2}
									id="contact_phone_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_cel_2"
								class="col-md-4 col-form-label">Celular</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_cel_2}
									id="contact_cel_2"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Referencia 3</h3>

						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="contact_valid_3Switch"
								bind:checked={values.contact_valid_3}
							/>
							<label
								class="custom-control-label"
								for="contact_valid_3Switch"
								>Contacto validado</label
							>
						</div>
						<div class="form-group row">
							<label
								for="contact_name_3"
								class="col-md-4 col-form-label">Nombre</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_name_3}
									id="contact_name_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_relation_3"
								class="col-md-4 col-form-label"
								>Parentesco</label
							>
							<div class="col-md-4">
								<PartnersContact_relation_3ListSelect
									bind:value={values.contact_relation_3}
									inlist={false}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_email_3"
								class="col-md-4 col-form-label">Email</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_email_3}
									id="contact_email_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_phone_3"
								class="col-md-4 col-form-label"
								>Teléfono fijo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_phone_3}
									id="contact_phone_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_cel_3"
								class="col-md-4 col-form-label">Celular</label
							>
							<div class="col-md-8 input-group">
								<input
								 class="form-control"
								 type="text"
								 bind:value={values.contact_cel_3}
								 id="contact_cel_3"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Experiencia Laboral 1</h3>

						<div class="form-group row">
							<label
								for="job_name"
								class="col-md-4 col-form-label"
								>Empresa - Trabajo anterior</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_name}
									id="job_name"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_boss"
								class="col-md-4 col-form-label"
								>Nombre jefe directo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_boss}
									id="job_boss"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_description"
								class="col-md-4 col-form-label"
								>Observaciones</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_description}
									id="job_description"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_phone"
								class="col-md-4 col-form-label"
								>Teléfono de contacto</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_phone}
									id="job_phone"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_start"
								class="col-md-4 col-form-label"
								>Incio trabajo</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.job_start}
									id="job_start"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label for="job_end" class="col-md-4 col-form-label"
								>Terminó trabajo</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.job_end}
									id="job_end"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Experiencia Laboral 2</h3>

						<div class="form-group row">
							<label
								for="job_name_2"
								class="col-md-4 col-form-label"
								>Empresa - Trabajo anterior</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_name_2}
									id="job_name_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_boss_2"
								class="col-md-4 col-form-label"
								>Nombre jefe directo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_boss_2}
									id="job_boss_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_description_2"
								class="col-md-4 col-form-label"
								>Observaciones</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_description_2}
									id="job_description_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_phone_2"
								class="col-md-4 col-form-label"
								>Teléfono jefe directo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_phone_2}
									id="job_phone_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_start_2"
								class="col-md-4 col-form-label"
								>Incio trabajo</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.job_start_2}
									id="job_start_2"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_end_2"
								class="col-md-4 col-form-label"
								>Terminó trabajo</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.job_end_2}
									id="job_end_2"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Experiencia Laboral 3</h3>

						<div class="form-group row">
							<label
								for="job_name_3"
								class="col-md-4 col-form-label"
								>Empresa - Trabajo anterior</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_name_3}
									id="job_name_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_boss_3"
								class="col-md-4 col-form-label"
								>Nombre jefe directo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_boss_3}
									id="job_boss_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_description_3"
								class="col-md-4 col-form-label"
								>Observaciones</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_description_3}
									id="job_description_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_phone_3"
								class="col-md-4 col-form-label"
								>Teléfono jefe directo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.job_phone_3}
									id="job_phone_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_start_3"
								class="col-md-4 col-form-label"
								>Incio trabajo</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.job_start_3}
									id="job_start_3"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="job_end_3"
								class="col-md-4 col-form-label"
								>Terminó trabajo</label
							>
							<div class="col-md-8">
								<input
									class="form-control"
									type="date"
									bind:value={values.job_end_3}
									id="job_end_3"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Experciencia</h3>
						{#if values.type == 2}
							<div class="form-group row">
								<div class="col-md-4 col-form-label">
									Actividades Cuidador
								</div>
								<div class="col-md-8">
									<Activities_auxOptions
										bind:value={values.activities_aux}
									/>
								</div>
							</div>{/if}{#if values.type == 0 || values.type == 1}
							<div class="form-group row">
								<div class="col-md-4 col-form-label">
									Actividades Enfermero Básico
								</div>
								<div class="col-md-8">
									<Activities_basicOptions
										bind:value={values.activities_basic}
									/>
								</div>
							</div>{/if}{#if values.type == 0 || values.type == 1}
							<div class="form-group row">
								<div class="col-md-4 col-form-label">
									Actividades Enfermero Avanzado
								</div>
								<div class="col-md-8">
									<Activities_advancedOptions
										bind:value={values.activities_advanced}
									/>
								</div>
							</div>{/if}
						<div class="form-group row">
							<div class="col-md-4 col-form-label">
								Enfermedades con experiencia
							</div>
							<div class="col-md-8">
								<Activities_generalOptions
									bind:value={values.activities_general}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Historial de salud</h3>

						<div class="form-group row">
							<div class="col-md-4 col-form-label">Hábitos</div>
							<div class="col-md-8">
								<HabitsOptions bind:value={values.habits} />
							</div>
						</div>
						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="diseaseSwitch"
								bind:checked={values.disease}
							/>
							<label
								class="custom-control-label"
								for="diseaseSwitch"
								>Padece de alguna enfermedad</label
							>
						</div>
						{#if values.disease}
							<div class="form-group row">
								<label
									for="disease_comments"
									class="col-md-4 col-form-label"
									>¿Cuales enfermedades?</label
								>
								<div class="col-md-8 input-group">
									<input
										class="form-control"
										type="text"
										bind:value={values.disease_comments}
										id="disease_comments"
									/>
								</div>
							</div>
						{/if}
						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="medsSwitch"
								bind:checked={values.meds}
							/>
							<label class="custom-control-label" for="medsSwitch"
								>Toma medicamento controlado</label
							>
						</div>
						<div
							class="custom-control custom-switch mb-2"
							dir="ltr"
						>
							<input
								type="checkbox"
								class="custom-control-input"
								id="sportsSwitch"
								bind:checked={values.sports}
							/>
							<label
								class="custom-control-label"
								for="sportsSwitch">Hace algun deporte</label
							>
						</div>
					</div>
				</div>
			</div>

			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Contacto de Emergencia</h3>

						<div class="form-group row">
							<label
								for="contact_name_eme"
								class="col-md-4 col-form-label">Nombre</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_name_eme}
									id="contact_name_eme"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_relation_eme"
								class="col-md-4 col-form-label"
								>Parentesco</label
							>
							<div class="col-md-4">
								<PartnersContact_relation_emeListSelect
									bind:value={values.contact_relation_eme}
									inlist={false}
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_phone_eme"
								class="col-md-4 col-form-label"
								>Teléfono fijo</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_phone_eme}
									id="contact_phone_eme"
								/>
							</div>
						</div>

						<div class="form-group row">
							<label
								for="contact_cel_eme"
								class="col-md-4 col-form-label">Celular</label
							>
							<div class="col-md-8 input-group">
								<input
									class="form-control"
									type="text"
									bind:value={values.contact_cel_eme}
									id="contact_cel_eme"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Historial de Ediciones</h3>
						<div class="form-group row">
						<div class="col-md-4 col-form-label">
							<button
							type="button"
							class="btn btn-outline-secondary"
							on:click={() => (showHistory = !showHistory)}
							>
							{showHistory ? "Ocultar historial de ediciones" : "Ver historial de ediciones"}
							</button>
						</div>
						</div>
					</div>

					{#if showHistory && values.history && values.history.length > 0}
						<div class="card-body">
						<div class="table-responsive">
							<table class="table table-sm mb-0">
							<thead class="thead-light">
								<tr>
								<th>Fecha</th>
								<th>Nombre</th>
								<th>UserId</th>
								</tr>
							</thead>
							<tbody>
								{#each values.history as historyItem}
								<tr>
									<!-- <td>{new Date(historyItem.edited).toLocaleString()}</td> -->
									<td>
									{#if historyItem.edited && historyItem.edited.toDate}
										{historyItem.edited.toDate().toLocaleString("es-MX")}
									{:else if historyItem.edited instanceof Date}
										{historyItem.edited.toLocaleString("es-MX")}
									{:else}
										-
									{/if}
									</td>
									<td>{historyItem.editedByName}</td>
									<td>{historyItem.editedBy}</td>
								</tr>
								{/each}
							</tbody>
							</table>
						</div>
						</div>
					{:else if showHistory}
						<div class="card-body">
						<div class="alert alert-info mb-0">
							No hay historial de ediciones registrado.
						</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Historial de Cambios de Pago -->
		<div class="row">
			<div class="col">
				<div class="card">
					<div class="card-body">
						<h3>Historial de Cambios de Pago</h3>
						<div class="form-group row">
						<div class="col-md-4 col-form-label">
							<button
							type="button"
							class="btn btn-outline-warning"
							on:click={() => (showPayHistory = !showPayHistory)}
							>
							{showPayHistory ? "Ocultar historial de pagos" : "Ver historial de pagos"}
							</button>
						</div>
						</div>
					</div>

					{#if showPayHistory && values.payHistory && values.payHistory.length > 0}
						<div class="card-body">
						<div class="table-responsive">
							<table class="table table-sm mb-0">
							<thead class="thead-light">
								<tr>
								<th>Fecha</th>
								<th>Pago Anterior</th>
								<th>Pago Nuevo</th>
								<th>Cambio</th>
								<th>Modificado por</th>
								</tr>
							</thead>
							<tbody>
								{#each values.payHistory as payItem}
								<tr>
									<td>
									{#if payItem.changeDate && payItem.changeDate.toDate}
										{payItem.changeDate.toDate().toLocaleString("es-MX")}
									{:else if payItem.changeDate instanceof Date}
										{payItem.changeDate.toLocaleString("es-MX")}
									{:else}
										-
									{/if}
									</td>
									<td class="text-danger">${payItem.previousPay || 0}</td>
									<td class="text-success">${payItem.newPay || 0}</td>
									<td>
										{#if (payItem.newPay || 0) > (payItem.previousPay || 0)}
											<span class="badge badge-success">
												+${(payItem.newPay || 0) - (payItem.previousPay || 0)}
											</span>
										{:else if (payItem.newPay || 0) < (payItem.previousPay || 0)}
											<span class="badge badge-danger">
												-${(payItem.previousPay || 0) - (payItem.newPay || 0)}
											</span>
										{:else}
											<span class="badge badge-secondary">Sin cambio</span>
										{/if}
									</td>
									<td>{payItem.changedByName}</td>
								</tr>
								{/each}
							</tbody>
							</table>
						</div>
						</div>
					{:else if showPayHistory}
						<div class="card-body">
						<div class="alert alert-info mb-0">
							No hay cambios de pago registrados.
						</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</form>
</div>
{#if buttons}
	<div class="row modal-footer">
		<div class="col-12">
			<div class="card">
				<div class="card-body">
					<button
						on:click={updateData}
						class="btn btn-primary waves-effect waves-light"
						disabled={loading}
					>
						{#if loading}<i
								class="bx bx-loader bx-spin font-size-16 align-middle mr-2"
							/>{/if}
						Guardar</button
					>
					{#if loading}
						<div
							class="spinner-grow text-secondary m-1"
							role="status"
						>
							<span class="sr-only">Guardando...</span>
						</div>
					{/if}
					<button
						on:click={cancel}
						class="btn btn-light waves-effect waves-light"
						disabled={loading}
					>
						Cancelar</button
					>
				</div>
			</div>
		</div>
		<!-- end col -->
	</div>
	<!-- end row -->
{/if}
