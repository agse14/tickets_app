<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    //import {routes} from "../menu";
    import { fun } from "../callable";
    import { permissions, profile, fbuser } from "../stores.js";
    import PatientsEdit from "./PatientsEdit.svelte";

    import { billing_period as patients_billing_period } from "../controls/patients.js";
    import { branches } from "../controls/branches";
    import PatientFormats from "../controls/PatientFormats.svelte";
    import FormatsOptions from "../controls/FormatsOptions.svelte";
    import ItemsOptions from "../controls/ItemsOptions.svelte";
    import { medical_service as patients_medical_service } from "../controls/patients.js";
    import { room_inventory } from "../controls/room_inventory";
    import { status as patients_status } from "../controls/patients.js";
    import { staytype as patients_staytype } from "../controls/patients.js";

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

    let patients = [];

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
            if (!$permissions.admin && !$permissions.patients) {
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
        datatable = jQuery("#patients-dt").DataTable({
            lengthMenu: [
                [10, 25, 50, -1],
                ["10 Pacientes", "25 Pacientes", "50 Pacientes", "Todo"],
            ],
            data: patients,
            createdRow: function (row, data, index) {},
            columns: [
                
                {
                    data: "name",
                    name: "Nombre del huésped",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        if (data.length > 90) {
                            data = data.substring(0, 90) + "...";
                        }
                        return html(
                            '<a href="#/editpatients/' +
                                id +
                                '">' +
                                data +
                                "</a>"
                        );
                    },
                },
                { data: "statusName", name: "Estatus", width: "auto" },
                {
                    data: "entrydate",
                    name: "Fecha de ingreso",
                    width: "auto",
                    render: function (data, type, row, meta) {
                        return html(
                            timeToAgo(data) +
                                "<br /><small>" +
                                timeFormated(data) +
                                "</small>"
                        );
                    },
                },
                { data: "branchName", name: "Estancia", width: "auto" },
                // { data: "roomName", name: "Cuarto Asignado", width: "auto" },
                {
                    data: "monthcost",
                    render: function (data, type, row, meta) {
                        return "$ " + (data != undefined ? data : "");
                    },
                },
                {
                    data: "iva",
                    name: "Impuestos",
                    // width: 80,
                    visible: false,
                    render: function (data, type, row, meta) {
                        return data === true ? "Si" : "No";
                    },
                },
                {
                    data: "responsible_mobile",
                    render: function (data, type, row, meta) {
                        return "" + (data != undefined ? data : "");
                    },
                    visible: false,
                },
                {
                    data: "dischargeletter",
                    name: "Carta de alta",
                    width: 180,
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        return (
                            '<a href="#' +
                            "/dischargeletter/" +
                            row.id +
                            '" class="btn btn-light waves-effect">Carta de alta</a>'
                        );
                    },
                },
                {
                    data: "dischargeletter_btn",
                    name: "Historial Clinico",
                    width: 180,
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        return (
                            '<a href="#' +
                            "/editclinic_history/" +
                            row.id +
                            '" class="btn btn-light waves-effect">Historial Clinico</a>'
                        );
                    },
                },
                {
                    data: "btn_amount",
                    name: "Adeudo",
                    width: 180,
                    render: function (data, type, row, meta) {
                        var id = "";
                        if (row != undefined) id = row.id;
                        if (type.cells != undefined) {
                            id = type.cells[type.cells.length - 1].data;
                        }
                        return (
                            '<a href="#' +
                            "/addguest_payments/" +
                            row.id +
                            '" class="btn btn-light waves-effect">Adeudo</a>'
                        );
                    },
                },
                { data: 'btn_medicamentos', name:'Prescripciones',width:180, render: function (data, type, row, meta) {
                						var id = "";
                						if(row != undefined) id = row.id;
                						if(type.cells != undefined){
                							id = type.cells[type.cells.length-1].data;
                						}
                                    return '<a href="#'+"/prescriptions/patients/"+row.id+'" class="btn btn-light waves-effect">Prescripciones</a>';
                                }, },
                {
                    data: "did",
                    name: "Acciones",
                    render: function (data, type, row, meta) {
                        let buttons = "";
                        if($permissions.admin || $permissions.accounting){
                            buttons +=
                                    '<p><button type="button" class="btn btn-light waves-effect" onclick="baja(\'' +
                                    row.id +
                                    '\');">Dar de baja</button></p>';
                        }
                        if (hasEdit) {
                            if (modal) {
                                buttons +=
                                    '<button type="button" class="btn btn-light waves-effect" onclick="setEditId(\'' +
                                    data +
                                    '\');"><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>';
                            } else {
                                buttons +=
                                    '<a href="#/editpatients/' +
                                    data +
                                    '" class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>';
                            }
                        }
                        

                        return html(
                            buttons +
                                "<button onclick=\"deleteDoc('" +
                                data +
                                '\')" class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle"></i></button>'
                        );
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
                        // 'copy', 'csv', 'pdf'
                        {
                        extend: 'copy',
                        filename: 'Listado de Pacientes'
                        },
                        {
                        extend: 'excel',
                        filename: 'Listado de Pacientes'
                        },
                        {
                        extend: 'pdf',
                        filename: 'Listado de Pacientes'
                        }
                    ],
            responsive: true,
            scrollX: true,
            fixedColumns: true
        });

        datatable
            .buttons()
            .container()
            .appendTo("#patients-dt_wrapper .col-md-6:eq(0)");
    }
    function loadFirebaseData() {
        let query = db.collection("patients");
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
                    const temppatients = doc.data();
                    temppatients.id = doc.id;
                    temppatients.did = doc.id;
                    temppatients.statusName =
                        temppatients.status != undefined &&
                        patients_status[temppatients.status] != undefined
                            ? patients_status[temppatients.status]
                            : "";

                    temppatients.branchName = "";
                    $branches.forEach((elbranches) => {
                        if (elbranches.id == temppatients.branch) {
                            temppatients.branchName = elbranches.name;
                        }
                    });

                    temppatients.roomName = "";
                    $room_inventory.forEach((elroom_inventory) => {
                        if (elroom_inventory.id == temppatients.room) {
                            temppatients.roomName = elroom_inventory.name;
                        }
                    });

                    tmp.push(temppatients);
                });
                patients = tmp;
                await tick();
                if (datatable == undefined) {
                    loadData();
                } else {
                    datatable.clear();
                    datatable.rows.add(patients).draw(false);
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
                db.collection("patients").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }
    function baja(id) {
        Swal.fire({
            title: "¿Esta seguro?",
            text: "Desea dar de baja a este paciente",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Si, dar de baja!",
        }).then(function (result) {
            if (result.value) {
                db.collection("patients").doc(id).update({status: 2, discharge: new Date(), dischargeby: $fbuser.uid});
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("patients").doc(id).update(update);
    }
    window.setEditId = setEditId;
    window.deleteDoc = deleteDoc;
    window.asyncChange = asyncChange;
    window.baja = baja;

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

    function exportToCSV() {
        loading = true;
        db.collection("patients").get().then((querySnapshot) => {
            const data = [];
            const headers = [
                "ID", "Nombre", "Apodo", "Dirección", "Fecha de Ingreso", "Fecha de Alta", "Sucursal", "Cuarto", "Costo Mensual", "Crédito", "EMME", "RFC", "Teléfono", "Estatus", "Tipo de Estancia", "Período de Facturación", "Servicio Médico", "Número Médico", "Dispositivos", "Pañal", "Sueño", "Baño", "Comentarios Generales", "Características", "Alergias Alimentarias", "Alimentos Permitidos", "Alimentos No Permitidos", "Alergias Medicamentosas", "Nombre Responsable", "Relación Responsable", "Dirección Responsable", "Email Responsable", "Teléfono Responsable", "Móvil Responsable", "Nombre Familia 1", "Relación Familia 1", "Dirección Familia 1", "Email Familia 1", "Teléfono Familia 1", "Móvil Familia 1", "Nombre Familia 2", "Relación Familia 2", "Dirección Familia 2", "Email Familia 2", "Teléfono Familia 2", "Móvil Familia 2", "Creado Por", "Nombre Creador", "Fecha Agregado", "Fecha Editado", "Items (JSON)", "Payment Logs (JSON)"
            ];
            data.push(headers);

            querySnapshot.forEach((doc) => {
                const patient = doc.data();
                const row = [
                    doc.id,
                    patient.name || "",
                    patient.nickname || "",
                    patient.address || "",
                    patient.entrydate || "",
                    patient.dischargedate || "",
                    patient.branchName || (patient.branch ? getBranchName(patient.branch) : ""),
                    patient.roomName || (patient.room ? getRoomName(patient.room) : ""),
                    patient.monthcost || 0,
                    patient.credit || 0,
                    patient.emme || 0,
                    patient.rfc || "",
                    patient.telephone || 0,
                    patient.status || 0,
                    patient.staytype || 0,
                    patient.billing_period || 0,
                    patient.medical_service || 0,
                    patient.medical_number || 0,
                    patient.devices || "",
                    patient.diaper || "",
                    patient.sleep || "",
                    patient.restroom || "",
                    patient.general_comments || "",
                    patient.character || "",
                    patient.food_allergies || "",
                    patient.food_allowed || "",
                    patient.food_not_allowed || "",
                    patient.meds_allergies || "",
                    patient.responsible_name || "",
                    patient.responsible_relationship || "",
                    patient.responsible_address || "",
                    patient.responsible_email || "",
                    patient.responsible_telephone || 0,
                    patient.responsible_mobile || 0,
                    patient.family_name1 || "",
                    patient.family_relationship1 || "",
                    patient.family_address1 || "",
                    patient.family_email1 || "",
                    patient.family_telephone1 || 0,
                    patient.family_mobile1 || 0,
                    patient.family_name2 || "",
                    patient.family_relationship2 || "",
                    patient.family_address2 || "",
                    patient.family_email2 || "",
                    patient.family_telephone2 || 0,
                    patient.family_mobile2 || 0,
                    patient.createdBy || "",
                    patient.createdName || "",
                    patient.added ? patient.added.toDate().toISOString() : "",
                    patient.edited ? patient.edited.toDate().toISOString() : "",
                    patient.items ? JSON.stringify(patient.items) : "",
                    patient.paymentlogs ? JSON.stringify(patient.paymentlogs) : ""
                ];
                data.push(row);
            });

            // Convert to CSV
            const csvContent = data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "pacientes.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            loading = false;
        }).catch((error) => {
            console.error("Error exporting CSV:", error);
            loading = false;
            Swal.fire({
                title: "Error",
                text: "Error al exportar CSV: " + error.message,
                type: "error",
                confirmButtonColor: "#f46a6a",
            });
        });
    }

    function getBranchName(branchId) {
        const branch = $branches.find(b => b.id === branchId);
        return branch ? branch.name : "";
    }

    function exportToContratosCSV() {
        loading = true;
        db.collection("patients").get().then((querySnapshot) => {
            const data = [];
            const headers = [
                "contrato_id", "cliente_id", "sede", "tipo_alojamiento", "fecha_inicio", "fecha_fin", "dia_corte", "estado_contrato", "capacidad_asignada", "tarifa_diaria", "plan_tarifario"
            ];
            data.push(headers);

            querySnapshot.forEach((doc) => {
                const patient = doc.data();
                const contrato_id = "CON-" + doc.id;
                const cliente_id = doc.id; // Usando ID del paciente como cliente_id
                const sede = patient.branchName || getBranchName(patient.branch) || "";
                const tipo_alojamiento = getTipoAlojamiento(patient.staytype);
                const fecha_inicio = patient.entrydate || "";
                const fecha_fin = patient.dischargedate || "";
                const dia_corte = 13;
                const estado_contrato = getEstadoContrato(patient.status);
                const capacidad_asignada = 1;
                const tarifa_diaria = patient.monthcost ? (patient.monthcost / 30).toFixed(2) : "";
                const plan_tarifario = ""; // Opcional, dejar vacío

                const row = [
                    contrato_id, cliente_id, sede, tipo_alojamiento, fecha_inicio, fecha_fin, dia_corte, estado_contrato, capacidad_asignada, tarifa_diaria, plan_tarifario
                ];
                data.push(row);
            });

            // Convert to CSV
            const csvContent = data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "contratos.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            loading = false;
        }).catch((error) => {
            console.error("Error exporting contratos CSV:", error);
            loading = false;
            Swal.fire({
                title: "Error",
                text: "Error al exportar contratos CSV: " + error.message,
                type: "error",
                confirmButtonColor: "#f46a6a",
            });
        });
    }

    function getTipoAlojamiento(staytype) {
        const tipos = {
            0: "Individual",
            1: "Compartida2",
            2: "Compartida3",
            3: "Guardería"
        };
        return tipos[staytype] || "Individual";
    }

    function exportToCortesMensualesCSV() {
        loading = true;
        db.collection("patients").get().then((querySnapshot) => {
            const data = [];
            const headers = [
                "contrato_id", "corte_fecha", "periodo_inicio", "periodo_fin", "dias_en_periodo", "dias_activos_en_periodo", "ocupacion_en_periodo", "importe_periodo", "sede", "tipo_alojamiento", "notas"
            ];
            data.push(headers);

            querySnapshot.forEach((doc) => {
                const patient = doc.data();
                const contrato_id = "CON-" + doc.id;
                const sede = patient.branchName || getBranchName(patient.branch) || "";
                const tipo_alojamiento = getTipoAlojamiento(patient.staytype);
                const tarifa_diaria = patient.monthcost ? patient.monthcost / 30 : 0;
                const fecha_inicio = new Date(patient.entrydate);
                const fecha_fin = patient.dischargedate ? new Date(patient.dischargedate) : new Date();

                // Generar cortes mensuales desde fecha_inicio hasta fecha_fin
                const cortes = generateCortesMensuales(fecha_inicio, fecha_fin);

                cortes.forEach(corte => {
                    const periodo_inicio = corte.periodo_inicio;
                    const periodo_fin = corte.periodo_fin;
                    const dias_en_periodo = Math.ceil((periodo_fin - periodo_inicio) / (1000 * 60 * 60 * 24)) + 1;
                    const dias_activos_en_periodo = calculateDiasActivos(fecha_inicio, fecha_fin, periodo_inicio, periodo_fin);
                    const ocupacion_en_periodo = dias_activos_en_periodo; // Asumiendo igual, ajustar si hay datos de asistencia
                    const importe_periodo = (dias_activos_en_periodo * tarifa_diaria).toFixed(2);
                    const notas = dias_activos_en_periodo < dias_en_periodo ? `Fin contrato en ${fecha_fin.toISOString().split('T')[0]}` : "";

                    const row = [
                        contrato_id, corte.corte_fecha, periodo_inicio.toISOString().split('T')[0], periodo_fin.toISOString().split('T')[0], dias_en_periodo, dias_activos_en_periodo, ocupacion_en_periodo, importe_periodo, sede, tipo_alojamiento, notas
                    ];
                    data.push(row);
                });
            });

            // Convert to CSV
            const csvContent = data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "contrato_cortes_mensuales.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            loading = false;
        }).catch((error) => {
            console.error("Error exporting cortes mensuales CSV:", error);
            loading = false;
            Swal.fire({
                title: "Error",
                text: "Error al exportar cortes mensuales CSV: " + error.message,
                type: "error",
                confirmButtonColor: "#f46a6a",
            });
        });
    }

    function generateCortesMensuales(fecha_inicio, fecha_fin) {
        const cortes = [];
        let current = new Date(fecha_inicio.getFullYear(), fecha_inicio.getMonth(), 13);
        if (current < fecha_inicio) {
            current.setMonth(current.getMonth() + 1);
        }
        while (current <= fecha_fin) {
            const periodo_inicio = new Date(current.getFullYear(), current.getMonth() - 1, 14);
            const periodo_fin = new Date(current);
            cortes.push({
                corte_fecha: current.toISOString().split('T')[0],
                periodo_inicio,
                periodo_fin
            });
            current.setMonth(current.getMonth() + 1);
        }
        return cortes;
    }

    function exportToCatalogoTiposCSV() {
        const data = [];
        const headers = ["tipo_alojamiento", "descripcion", "cupo_por_contrato"];
        data.push(headers);

        const tipos = [
            ["Individual", "Alojamiento individual", 1],
            ["Compartida2", "Alojamiento compartido para 2 personas", 1],
            ["Compartida3", "Alojamiento compartido para 3 personas", 1],
            ["Guardería", "Servicio de guardería", 1]
        ];

        tipos.forEach(tipo => data.push(tipo));

        const csvContent = data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "catalogo_tipos.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportToCatalogoSedesCSV() {
        loading = true;
        db.collection("branches").get().then((querySnapshot) => {
            const data = [];
            const headers = ["sede", "ciudad", "estatus_sede"];
            data.push(headers);

            querySnapshot.forEach((doc) => {
                const branch = doc.data();
                const sede = branch.name;
                const ciudad = getCiudadFromBranch(sede); // Asumir lógica para ciudad
                const estatus_sede = "Activa"; // Asumir activa
                data.push([sede, ciudad, estatus_sede]);
            });

            const csvContent = data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "catalogo_sedes.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            loading = false;
        }).catch((error) => {
            console.error("Error exporting catalogo sedes CSV:", error);
            loading = false;
            Swal.fire({
                title: "Error",
                text: "Error al exportar catalogo sedes CSV: " + error.message,
                type: "error",
                confirmButtonColor: "#f46a6a",
            });
        });
    }

    function exportToSedeCapacidadCSV() {
        loading = true;
        db.collection("branches").get().then((querySnapshot) => {
            const data = [];
            const headers = ["sede", "tipo_alojamiento", "capacidad_diaria", "vigente_desde", "vigente_hasta"];
            data.push(headers);

            const tipos = ["Individual", "Compartida2", "Compartida3", "Guardería"];
            const capacidadDefault = 10; // Asumir capacidad por defecto
            const vigente_desde = new Date().toISOString().split('T')[0];
            const vigente_hasta = ""; // Vacío si sigue

            querySnapshot.forEach((doc) => {
                const branch = doc.data();
                const sede = branch.name;
                tipos.forEach(tipo => {
                    data.push([sede, tipo, capacidadDefault, vigente_desde, vigente_hasta]);
                });
            });

            const csvContent = data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "sede_capacidad.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            loading = false;
        }).catch((error) => {
            console.error("Error exporting sede capacidad CSV:", error);
            loading = false;
            Swal.fire({
                title: "Error",
                text: "Error al exportar sede capacidad CSV: " + error.message,
                type: "error",
                confirmButtonColor: "#f46a6a",
            });
        });
    }

    function getCiudadFromBranch(sede) {
        if (sede.includes("San Pedro")) return "San Pedro";
        if (sede.includes("Monterrey")) return "Monterrey";
        return "Desconocida";
    }
</script>

<div class="page-content">
    <TitleBar title="Pacientes" base="Inventario" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Administración Pacientes</h4>
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
                            <div class="col" />

                            <div class="col-md-auto align-self-end">
                                <button
                                    type="button"
                                    class="btn btn-warning waves-effect waves-light mr-2"
                                    on:click={exportToSedeCapacidadCSV}
                                    disabled={loading}
                                >
                                    {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
                                    Exportar Sede Capacidad CSV
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-primary waves-effect waves-light mr-2"
                                    on:click={exportToCatalogoSedesCSV}
                                    disabled={loading}
                                >
                                    {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
                                    Exportar Catálogo Sedes CSV
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-dark waves-effect waves-light mr-2"
                                    on:click={exportToCatalogoTiposCSV}
                                    disabled={loading}
                                >
                                    {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
                                    Exportar Catálogo Tipos CSV
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-success waves-effect waves-light mr-2"
                                    on:click={exportToCortesMensualesCSV}
                                    disabled={loading}
                                >
                                    {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
                                    Exportar Cortes Mensuales CSV
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-info waves-effect waves-light mr-2"
                                    on:click={exportToContratosCSV}
                                    disabled={loading}
                                >
                                    {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
                                    Exportar Contratos CSV
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-secondary waves-effect waves-light mr-2"
                                    on:click={exportToCSV}
                                    disabled={loading}
                                >
                                    {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
                                    Exportar Pacientes CSV
                                </button>
                                {#if modal}
                                    <button
                                        type="button"
                                        class="btn btn-primary waves-effect waves-light"
                                        on:click={() => {
                                            setEditId(undefined);
                                        }}>Agregar Paciente</button
                                    >
                                {:else}
                                    <button
                                        on:click={function () {
                                            if (
                                                filterName != undefined &&
                                                filterValue != undefined
                                            ) {
                                                push(
                                                    "/addpatients/" +
                                                        filterName +
                                                        "/" +
                                                        filterValue
                                                );
                                            } else {
                                                push("/addpatients");
                                            }
                                        }}
                                        class="btn btn-primary waves-effect waves-light"
                                        ><i
                                            class="bx bx-plus font-size-16 align-middle"
                                        /> Agregar Paciente</button
                                    >
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <table
                        id="patients-dt"
                        class="table table-striped table-bordered dt-responsive nowrap"
                        style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                    >
                        <thead>
                            <tr>
                                <th>Nombre del huésped</th>
                                <th>Estatus</th>
                                <th>Fecha de ingreso</th>
                                <th>Sucursal</th>
                                <!-- <th>Cuarto Asignado</th> -->
                                <th>Costo mensual</th>
                                <th>Impuestos</th>
                                <th>Celular</th>
                                <th>Carta de alta</th>
                                <th>Historial Clinico</th>
                                <th>Adeudo</th>
                                <th>Prescripciones</th>  
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            
                        </tbody>
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
                                        Agregar Paciente
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
                                                "#editModalScrollable"
                                            ).modal("hide");
                                            showModal = false;
                                        }}
                                        aria-label="Close"
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                {#if showModal}
                                    <PatientsEdit
                                        params={editData}
                                        onBack={() => {
                                            editData = {
                                                field: filterName,
                                                value: filterValue,
                                                bid: undefined,
                                            };
                                            jQuery(
                                                "#editModalScrollable"
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
    {#each patients as row (row.id)}
                        <tr in:receive="{{key: row.id}}"
                        out:send="{{key: row.id}}"
                        animate:flip>
                            <td><a href="/editpatients/{row.id}" use:link>{row.name}</a></td>
<td><PatientsStatusListSelect value={row.status} inlist={true} /></td>
<td>{timeToAgo(row.entrydate)}<br /><small>{timeFormated(row.entrydate)}</small></td>
<td><h5>{row.branchName}</h5></td>
<td><h5>{row.roomName}</h5></td>
{ data: 'monthcost', render: function (data, type, row, meta) {
                    return '$ '+(data != undefined?data:'');
                }, },
<td>{row.iva?'Si':'No'}</td>
{ data: 'responsible_mobile', render: function (data, type, row, meta) {
                    return ''+(data != undefined?data:'');
                }, },
<td><a use:link={"/dischargeletter/"+row.id} class="btn btn-light waves-effect">Carta de alta</a></td>
<td><a use:link={"/editclinic_history/"+row.id} class="btn btn-light waves-effect">Historial Clinico</a></td>
<td><a use:link={"/addguest_payments/"+row.id} class="btn btn-light waves-effect">Adeudo</a></td>
<td><a use:link={"/prescriptions/patients/"+row.id} class="btn btn-light waves-effect">Prescripciones</a></td>

                            <td>
                                {#if hasEdit}
                                    {#if modal}
                                    <button type="button" class="btn btn-light waves-effect" on:click={()=>{ setEditId(row.id);}}><i class="bx bx-edit-alt font-size-16 align-middle"></i></button>
                                    {:else}
                                     <a href="/editpatients/{row.id}" use:link class="btn btn-light waves-effect"><i class="bx bx-edit-alt font-size-16 align-middle"></i></a>
                                    {/if}
                                {/if}
                            <button on:click={()=>{deleteDoc(row.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" disabled={loading}></i></button>
                            </td>
                        </tr>
                        {/each}
-->
<!-- <style>
    .row {
        /* padding-left: 0 !important;
        padding-right: 0 !important; */
        width: 100% !important;
    }
</style> -->
