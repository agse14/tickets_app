<script>
    import { onMount } from "svelte";
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { permissions } from "../stores.js";
    // import { DateTime } from "luxon";
    // import { db } from "../firebase"; // Asegúrate de tener Firebase configurado

    let branches = [];
    let selectedBranchId = "";
    let selectedCollection = "patients";
    let deleteStartDate = "";
    let deleteEndDate = "";
    let collections = ["patients", "jobs"]; // Puedes agregar más colecciones aquí

    const loadBranches = async () => {
        try {
            const branchesSnapshot = await db.collection("branches").get();
            branches = branchesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error al cargar estancias:", error);
        }
    };

    const processAndUpdatePatients = async () => {
        try {
            if (!selectedBranchId) {
                console.log("Selecciona una estancia primero.");
                return;
            }

            const patientsSnapshot = await db.collection("patients")
                .where("branch", "==", selectedBranchId)
                .where("status", "==", 0)
                .get();

            if (patientsSnapshot.empty) {
                console.log("No hay pacientes con status 0 en esta estancia.");
                return;
            }

            patientsSnapshot.forEach(async (patientDoc) => {
                const patientData = patientDoc.data();
                const addedDate = patientData.added?.toDate?.();

                if (!addedDate) {
                    console.log(`Paciente ${patientDoc.id} no tiene campo 'added' válido.`);
                    return;
                }

                const dayOfMonth = addedDate.getDate().toString().padStart(2, '0');
                const paymentlogs = patientData.paymentlogs || {};
                const recentPaymentLog = Object.keys(paymentlogs).sort().pop();

                if (recentPaymentLog) {
                    let [year, month] = recentPaymentLog.split("-");
                    let newDate = new Date(`${year}-${month}-01`);
                    newDate.setMonth(newDate.getMonth() + 1);

                    const newYear = newDate.getFullYear();
                    const newMonth = (newDate.getMonth() + 1).toString().padStart(2, '0');
                    const newPaymentDate = `${newYear}-${newMonth}-${dayOfMonth}`;

                    await db.collection("patients").doc(patientDoc.id).update({
                        newPaymentDate
                    });

                    console.log(`Actualizado ${patientDoc.id}: ${newPaymentDate}`);
                } else {
                    console.log(`Paciente ${patientDoc.id} no tiene registros en 'paymentlogs'.`);
                }
            });
        } catch (error) {
            console.error("Error al actualizar pacientes:", error);
        }
    };

    const deleteDocumentsInDateRange = async () => {
        try {
            if ( !selectedCollection || !deleteStartDate || !deleteEndDate) {
                alert("Completa todos los campos para eliminar registros.");
                return;
            }

            const start = DateTime.fromISO(deleteStartDate).startOf("day");
            const end = DateTime.fromISO(deleteEndDate).endOf("day");

            const snapshot = await db.collection(selectedCollection)
                // .where("branch", "==", selectedBranchId)
                .get();

            const deletions = snapshot.docs.filter(doc => {
                const data = doc.data();
                if (!data.added) return false;
                const added = DateTime.fromJSDate(data.added.toDate());
                return added >= start && added <= end;
            });

            for (const doc of deletions) {
                await db.collection(selectedCollection).doc(doc.id).delete();
                console.log(`Eliminado: ${doc.id}`);
            }

            alert(`Se eliminaron ${deletions.length} registros de la colección '${selectedCollection}'.`);
        } catch (error) {
            console.error("Error al eliminar documentos:", error);
        }
    };

    const updateRoomInventoryStatus = async () => {
        try {
            const confirmation = confirm("¿Estás seguro de que quieres actualizar todos los documentos de room_inventory con status = 1?");
            
            if (!confirmation) {
                return;
            }

            console.log("Iniciando actualización de room_inventory...");
            
            // Obtener todos los documentos de room_inventory
            const roomInventorySnapshot = await db.collection("room_inventory").get();
            
            if (roomInventorySnapshot.empty) {
                alert("No se encontraron documentos en la colección room_inventory.");
                return;
            }

            let updatedCount = 0;
            const totalDocs = roomInventorySnapshot.size;
            
            // Crear un batch para operaciones más eficientes
            const batch = db.batch();
            
            roomInventorySnapshot.forEach((doc) => {
                const docRef = db.collection("room_inventory").doc(doc.id);
                batch.update(docRef, { 
                    status: 1,
                    updated: new Date() // Agregar timestamp de actualización
                });
                updatedCount++;
            });
            
            // Ejecutar todas las actualizaciones
            await batch.commit();
            
            console.log(`Actualizados ${updatedCount} de ${totalDocs} documentos.`);
            alert(`Se actualizaron exitosamente ${updatedCount} documentos de room_inventory con status = 1.`);
            
        } catch (error) {
            console.error("Error al actualizar room_inventory:", error);
            alert("Error al actualizar los documentos. Ver consola para más detalles.");
        }
    };

    onMount(() => {
        loadBranches();
    });
</script>

<div class="page-content">
    <TitleBar title="Inicio" base="Dashboard" />

    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title mb-4">Bienvenido</h4>
                    <p>Sistema de administración</p>

                    <!-- Selector de branches -->
                    <div>
                        <label for="branch-select">Selecciona una estancia:</label>
                        <select id="branch-select" bind:value={selectedBranchId}>
                            <option value="" disabled selected>Seleccionar...</option>
                            {#each branches as branch}
                                <option value={branch.id}>{branch.name}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Botón para actualizar pacientes -->
                    <div class="text-center mt-4">
                        <button class="btn btn-primary" on:click={processAndUpdatePatients}>
                            Actualizar pacientes
                        </button>
                    </div>

                    <!-- Botón para actualizar room_inventory -->
                    <div class="text-center mt-4">
                        <button class="btn btn-warning" on:click={updateRoomInventoryStatus}>
                            Actualizar Room Inventory (Status = 1)
                        </button>
                        <small class="d-block text-muted mt-2">
                            Esta acción actualizará TODOS los documentos de room_inventory
                        </small>
                    </div>

                    <!-- Sección para eliminar por fechas -->
                    <div class="mt-5">
                        <h5>Eliminar registros por rango de fecha</h5>
                        <label>Colección:
                            <select bind:value={selectedCollection}>
                                {#each collections as collection}
                                    <option value={collection}>{collection}</option>
                                {/each}
                            </select>
                        </label>
                        <label>Desde:
                            <input type="date" bind:value={deleteStartDate} />
                        </label>
                        <label>Hasta:
                            <input type="date" bind:value={deleteEndDate} />
                        </label>

                        <div class="text-center mt-3">
                            <button class="btn btn-danger" on:click={deleteDocumentsInDateRange}>
                                Eliminar registros
                            </button>
                        </div>
                    </div>

                    <!-- Botón adicional según permisos -->
                    <div class="text-center mt-4">
                        {#if $permissions && $permissions.supervision_tags}
                            <a href="/cardclose" use:link class="btn btn-primary">Cierre de turno</a>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
