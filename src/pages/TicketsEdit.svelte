<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import { fbuser, permissions } from "../stores.js";
  import TitleBar from "../TitleBar.svelte";
  import { onMount, onDestroy } from "svelte";
  import ListSelect from "../controls/ListSelect.svelte";
  import DocumentField from "../controls/DocumentField.svelte";
  import AttachmentsManager from "../controls/AttachmentsManager.svelte";

  // Variables para Monday
  let mondayToken = '';
  let mondayConfig = {}; // Para almacenar config como boardId, etc.

  function checkVisibles() {
    console.log("checkVisibles");
  }

  export let params = {};
  export let values = { status: 0, priority: 1, category: 0, estimatedHours: 0, finalHours: 0, requestingArea: 0 }; // Default values
  export let autoAdd = false;
  export let buttons = true;
  export let onBack = () => {
    pop();
  };

  let old = {};
  let exists = false;
  let comments = [];
  let newComment = "";

  let loading = true;
  let form;
  let branches = [];
  let sprints = [];
  let users = [];
  let assignedIndex = -1;

  let filterName = params.field;
  let filterValue = params.value;

  const tempId = params.bid;

  // Función para cargar el token y config de Monday desde Firebase
  // ─────────────────────────────────────────────────────────────────
  // Crea el documento  Firestore → config/monday  con estos campos:
  //   accessToken  → Personal API Token de Monday
  //   boardId      → ID numérico del tablero (ver URL del board)
  // El resto ya viene preconfigurado con los IDs reales de tu board.
  // ─────────────────────────────────────────────────────────────────
  // Defaults de columnas por board conocido.
  // statusIndex / priorityIndex: mapeo de estado/prioridad del ticket → índice en Monday.
  // Se usa { index: N } en la API, que es más robusto que label strings.
  const _mondayBoardDefaults = {
    '6957252119': {
      statusColumnId:   'estado_mkmmt37k',  // Estado: {0: En curso, 1: Listo, 2: Detenido}
      priorityColumnId: null,               // priority_mkmmmc4d - omitir (labels desconocidos)
      peopleColumnId:   'person',
      hoursColumnId:    'n_meros_mkmm8ewd',
      dateColumnId:     'date4',
      // ticket status (0-4) → índice Monday de estado_mkmmt37k
      statusIndex:  { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2 },
    },
    '6956966754': {
      statusColumnId:   null,               // 'Persona Delego' - no aplica a estado del ticket
      priorityColumnId: null,
      peopleColumnId:   'person',
      hoursColumnId:    null,
      dateColumnId:     'date4',
      statusIndex:      {},
    },
    '18390686328': {
      statusColumnId:   'status',           // Columna de estado con labels personalizados
      priorityColumnId: null,
      peopleColumnId:   'person',
      hoursColumnId:    null,
      dateColumnId:     'date4',
      // ticket status (0-4) → índice Monday basado en labels del board
      statusIndex:  { 0: 0, 1: 1, 2: 2, 3: 12, 4: 14 }, // 0:Espera, 1:Listo, 2:Seguimiento, 3:No se pudo, 4:Recordatorio
    },
  };

  async function loadMondayConfig() {
    try {
      const doc = await db.collection('config').doc('monday').get();
      if (doc.exists) {
        const data = doc.data();
        mondayToken = data.accessToken || '';

        if (data.boardMapping && data.boards) {
          // ── Formato nuevo (importado desde ImportMonday) ──────────────────
          const normalizedMapping = {};
          for (const key of Object.keys(data.boardMapping)) {
            normalizedMapping[Number(key)] = String(data.boardMapping[key]);
          }
          const normalizedBoards = {};
          for (const [bId, bConfig] of Object.entries(data.boards)) {
            const defaults = _mondayBoardDefaults[String(bId)] || {};
            // Acepta groupIds (formato export) o groupMapping
            const rawGroups = bConfig.groupMapping || bConfig.groupIds || {};
            const groupMapping = {};
            for (const [k, v] of Object.entries(rawGroups)) {
              groupMapping[Number(k)] = v;
            }
            normalizedBoards[String(bId)] = { ...defaults, ...bConfig, groupMapping };
          }
          mondayConfig = { boardMapping: normalizedMapping, boards: normalizedBoards };
          console.log('Monday config cargada (formato nuevo):', mondayConfig);
        } else {
          // ── Formato antiguo: un solo boardId ─────────────────────────────
          const boardId = String(data.boardId || '6957252119');
          const defaults = _mondayBoardDefaults[boardId] || _mondayBoardDefaults['6957252119'];
          mondayConfig = {
            boardMapping: { 0: boardId, 1: boardId, 2: boardId, 3: boardId,
                            4: boardId, 5: boardId, 6: boardId, 7: boardId,
                            8: '18390686328' },
            boards: {
              [boardId]: {
                ...defaults,
                groupMapping: {
                  0: 'grupo_nuevo24260__1',
                  1: 'grupo_nuevo75216__1',
                  2: 'group_mkrhchzy',
                  3: 'grupo_nuevo31593__1',
                  4: 'grupo_nuevo_mkky8fgg',
                  5: 'group_mkxcsw9x',
                  6: 'grupo_nuevo31593__1',
                  7: 'grupo_nuevo75216__1',
                },
              },
              '18390686328': {
                ..._mondayBoardDefaults['18390686328'],
                groupMapping: { 8: 'group_mm1sfw7f' },
              },
            },
          };
          console.log('Monday config cargada (formato antiguo) boardId:', boardId);
        }
      } else {
        console.warn('Config de Monday no encontrada. Crea el documento config/monday en Firestore.');
      }
    } catch (error) {
      console.error('Error cargando config de Monday:', error);
    }
  }

  // Función para hacer queries/mutations a Monday directamente desde el navegador.
  // El token debe ser el Personal API Token de Monday (sin prefijo "Bearer").
  async function mondayQuery(query, variables = {}) {
    if (!mondayToken) {
      console.error('mondayQuery: Token no disponible.');
      return null;
    }
    const token = mondayToken.replace(/^Bearer\s+/i, '').trim();
    try {
      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({ query, variables }),
      });
      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        console.error('mondayQuery: error HTTP:', response.status, txt);
        return null;
      }
      const result = await response.json();
      if (result.errors) {
        console.error('mondayQuery: errores de Monday API:', result.errors);
        return null;
      }
      return result.data;
    } catch (error) {
      console.error('mondayQuery: falló la petición (si ves CORS + 401, el token es inválido):', error);
      return null;
    }
  }

  // Función para crear un item en Monday (soporta multi-board)
  async function createMondayItem(itemName, area, priority, estimatedHours, assigneeId = null) {
    if (!mondayToken || !mondayConfig.boardMapping) return null;

    const boardId = mondayConfig.boardMapping[area];
    const boardConfig = boardId && mondayConfig.boards && mondayConfig.boards[boardId];
    if (!boardId || !boardConfig) {
      console.error('createMondayItem: no hay config para área', area, 'boardId:', boardId);
      return null;
    }

    const groupId = boardConfig.groupMapping[area] || Object.values(boardConfig.groupMapping)[0] || 'topics';

    const cols = {};
    // Usar { index: N } en lugar de { label: string } para evitar errores por texto inexacto
    if (boardConfig.statusColumnId && boardConfig.statusIndex)
      cols[boardConfig.statusColumnId] = { index: boardConfig.statusIndex[0] ?? 0 };
    if (boardConfig.dateColumnId)
      cols[boardConfig.dateColumnId] = { date: new Date().toISOString().split('T')[0] };
    if (boardConfig.hoursColumnId && estimatedHours)
      cols[boardConfig.hoursColumnId] = estimatedHours;
    if (assigneeId && boardConfig.peopleColumnId)
      cols[boardConfig.peopleColumnId] = { personsAndTeams: [{ id: Number(assigneeId), kind: 'person' }] };

    console.log('createMondayItem: boardId', boardId, 'groupId', groupId, 'cols', cols);

    const mutation = `
      mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) {
          id
        }
      }
    `;

    const data = await mondayQuery(mutation, { boardId, groupId, itemName, columnValues: JSON.stringify(cols) });
    return data?.create_item?.id || null;
  }

  // Función para actualizar un item existente en Monday (soporta multi-board)
  async function updateMondayItem(mondayItemId, status, priority, estimatedHours, finalHours, assigneeId = null) {
    if (!mondayItemId || !mondayToken) return null;

    const boardId = values.mondayBoardId ||
      (mondayConfig.boardMapping && mondayConfig.boardMapping[Number(values.area)]) ||
      Object.values(mondayConfig.boardMapping || {})[0];
    const boardConfig = boardId && mondayConfig.boards && mondayConfig.boards[boardId];
    if (!boardConfig) return null;

    const cols = {};
    if (boardConfig.statusColumnId && boardConfig.statusIndex)
      cols[boardConfig.statusColumnId] = { index: boardConfig.statusIndex[status] ?? 0 };
    if (boardConfig.hoursColumnId)
      cols[boardConfig.hoursColumnId] = finalHours || estimatedHours || 0;
    if (assigneeId && boardConfig.peopleColumnId)
      cols[boardConfig.peopleColumnId] = { personsAndTeams: [{ id: Number(assigneeId), kind: 'person' }] };

    const mutation = `
      mutation ($itemId: ID!, $boardId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(item_id: $itemId, board_id: $boardId, column_values: $columnValues) {
          id
        }
      }
    `;

    return await mondayQuery(mutation, { itemId: mondayItemId, boardId, columnValues: JSON.stringify(cols) });
  }
  // Función para agregar una actualización (comentario) a un item de Monday
  async function addMondayUpdate(itemId, body) {
    if (!itemId || !body || !mondayToken) return null;

    const mutation = `
      mutation ($itemId: ID!, $body: String!) {
        create_update(item_id: $itemId, body: $body) {
          id
        }
      }
    `;

    const data = await mondayQuery(mutation, { itemId, body });
    return data?.create_update?.id || null;
  }

  const statusOptions = [
    "Abierto",
    "En Progreso",
    "Resuelto",
    "Cerrado",
    "Cancelado"
  ];

  // Priority options for tickets
  const priorityOptions = [
    "Baja",
    "Normal",
    "Alta",
    "Crítica"
  ];

  // Category options for tickets
  const areaOptions = [
    "Sistemas",
    "Administrativo",
    "Recursos Humanos",
    "Mantenimiento",
    "Comercial",
    "Gerencia",
    "Operaciones",
    "Estancias",
    "Proyectos"
  ];

  // Issue types shown only for area == 0
  const issueTypes = [
    "Soporte técnico",
    "Requerimiento nuevo",
    "Bug/Error",
    "Soporte técnico (App)",
    "Requerimiento nuevo (App)",
    "Bug/Error (App)"
  ];

  if (filterName != undefined && filterValue != undefined) {
    values[filterName] = filterValue;
  }
  if (params.wild != undefined && params.wild != "") {
    let parray = params.wild.split("/");
    for (let p = 0; p < parray.length; p++) {
      const element = parray[p];
      if (p % 2 == 0 && parray[p + 1] != undefined && parray[p + 1] != "") {
        values[element] = parray[p + 1];
      }
    }
  }

  onMount(() => {
    form = document.getElementById("form");
    
    // Cargar config de Monday
    loadMondayConfig();
    
    if (tempId == null) {
      // For new tickets, the number will be generated during save
      loading = false;
    } else {
      db.collection("tickets")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            // No data
          } else {
            exists = true;
            values = query.data();
            values.id = query.id;

            // Ownership check: if not admin/support/tickets and not owner and not assigned, go back
            if (!$permissions.admin && !$permissions.support && !$permissions.tickets) {
              if ($fbuser && values.reportedBy && $fbuser.uid !== values.reportedBy && (!values.assignedToEmail || values.assignedToEmail !== $fbuser.email)) {
                // Not allowed to view this ticket
                Swal.fire({
                  icon: 'warning',
                  title: 'Acceso denegado',
                  text: 'No tiene permisos para ver este ticket.',
                  confirmButtonText: 'Aceptar'
                }).then(() => {
                  onBack();
                });
                return;
              }
            }

            if (values.createdDate != undefined) {
              let fecha = DateTime.fromJSDate(values.createdDate.toDate()).toISODate();
              values.createdDateString = fecha;
            }
            
            old = query.data();
          }
          loading = false;
        });

      // Load comments for this ticket
      loadComments();
      
      // Set up real-time listener for attachments
      loadAttachments();
    }

    // Load branches for Estancias selection
    db.collection("branches").get().then(snapshot => {
      branches = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      // If editing and requestingArea is Estancias, set branchIndex
      if (exists && values.requestingArea == 7 && values.branchId) {
        values.branchIndex = branches.findIndex(b => b.id === values.branchId);
      }
    });

    // Load sprints for sprint selection
    db.collection("sprints").where("status", "in", ["active", "planned"]).orderBy("startDate", "desc").get().then(snapshot => {
      sprints = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, status: doc.data().status }));
      // If editing and has sprintId, set sprintIndex
      if (exists && values.sprintId) {
        values.sprintIndex = sprints.findIndex(s => s.id === values.sprintId) + 1; // +1 because index 0 is "Sin asignar"
      }
    });
    
    // Load users for assignment selector
    db.collection('users').get().then(snapshot => {
      users = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().displayName || doc.data().name || doc.data().email, email: doc.data().email }));
      if (exists && values.assignedTo) {
        assignedIndex = users.findIndex(u => u.id === values.assignedTo);
      }
    });
  });

  function loadComments() {
    if (!tempId) return;
    
    db.collection("ticket_comments")
      .where("ticketId", "==", tempId)
      .orderBy("createdDate", "asc")
      .onSnapshot((querySnapshot) => {
        comments = [];
        querySnapshot.forEach((doc) => {
          const comment = doc.data();
          comment.id = doc.id;
          comments.push(comment);
        });
        comments = comments;
      });
  }

  function loadAttachments() {
    if (!tempId) return;
    
    // Listen for real-time updates to attachments
    db.collection("tickets")
      .doc(tempId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data.attachments) {
            values.attachments = data.attachments;
            values = values; // Trigger reactivity
          }
        }
      });
  }

  // Keep values.assignedTo fields in sync with selected index
  $: if (assignedIndex !== undefined && assignedIndex !== null && assignedIndex >= 0 && users[assignedIndex]) {
    values.assignedTo = users[assignedIndex].id;
    values.assignedToName = users[assignedIndex].name;
    values.assignedToEmail = users[assignedIndex].email;
  }

  function addComment() {
    if (!newComment.trim() || !tempId) return;

    const comment = {
      ticketId: tempId,
      comment: newComment.trim(),
      createdDate: new Date(),
      createdBy: $fbuser.uid,
      createdByName: $fbuser.displayName || $fbuser.email || "Usuario",
      isInternal: false
    };

    db.collection("ticket_comments")
      .add(comment)
      .then(() => {
        newComment = "";
        // Update ticket's last updated
        db.collection("tickets").doc(tempId).update({
          lastUpdated: new Date(),
          lastUpdatedBy: $fbuser.uid
        });
      });
  }

  function cancel() {
    onBack();
  }

  function updateData() {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Validate required fields
    if (!values.title || values.title.trim() === "") {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El título del ticket es obligatorio.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!values.description || values.description.trim() === "") {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'La descripción del ticket es obligatoria.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (checkVisibles != undefined) {
      checkVisibles();
    }
    loading = true;

    if (tempId == null) {
      // Ensure numeric types for fields
      values.area = Number(values.area);
      values.category = Number(values.area);
      values.requestingArea = Number(values.requestingArea);
      values.priority = Number(values.priority);
      values.status = Number(values.status);
        // issueType only exists for area == 0, coerce if present
        if (values.issueType !== undefined && values.issueType !== null) {
          values.issueType = Number(values.issueType);
        }
        // hours fields
        values.estimatedHours = Number(values.estimatedHours) || 0;
        values.finalHours = Number(values.finalHours) || 0;
        // If requestingArea is Estancias, set branchId and branchName
        if (values.requestingArea == 7 && values.branchIndex !== undefined && branches[values.branchIndex]) {
          values.branchId = branches[values.branchIndex].id;
          values.branchName = branches[values.branchIndex].name;
        }
        // If sprintIndex is selected, set sprintId
        if (values.sprintIndex !== undefined && values.sprintIndex > 0 && sprints[values.sprintIndex - 1]) {
          values.sprintId = sprints[values.sprintIndex - 1].id;
        } else {
          values.sprintId = null;
        }
      values.createdDate = new Date();
      values.createdBy = $fbuser.uid;
      values.createdByName = $fbuser.displayName || $fbuser.email || "Usuario";
      values.reportedBy = $fbuser.uid;
      values.reportedByName = $fbuser.displayName || $fbuser.email || "Usuario";
      
      // Generate a daily auto-incrementing folio: prefix YYMMDD + sequence per day
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const prefix = `${year}${month}${day}`; // e.g. 251002

      const countersRef = db.collection('counters').doc(`tickets_${prefix}`);

      // Use transaction to ensure atomic counter increment and ticket creation
      db.runTransaction(async (transaction) => {
        try {
          const doc = await transaction.get(countersRef);
          let nextSeq = 1;
          
          if (!doc.exists) {
            // First ticket of the day
            transaction.set(countersRef, { 
              seq: nextSeq,
              date: prefix,
              lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Increment existing counter
            const current = doc.data().seq || 0;
            nextSeq = current + 1;
            transaction.update(countersRef, { 
              seq: nextSeq,
              lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
          
          // Generate the ticket number
          const ticketNumber = `${prefix}${nextSeq}`;
          
          // Create the ticket document with the generated number
          const ticketRef = db.collection("tickets").doc();
          values.ticketNumber = ticketNumber;
          transaction.set(ticketRef, values);
          
          return { ticketRef, ticketNumber };
        } catch (error) {
          console.error("Transaction failed:", error);
          throw error;
        }
      })
        .then(async (result) => {
          console.log("Ticket created with number:", result.ticketNumber);
          
          // Crear item en Monday
          if (mondayToken && mondayConfig.boardMapping) {
            try {
              const itemName = `Ticket #${result.ticketNumber}: ${values.title}`;
              const mondayAssigneeId = values.assignedToEmail
                ? await getMondayUserId(values.assignedToEmail)
                : null;

              const mondayItemId = await createMondayItem(
                itemName,
                Number(values.area),
                Number(values.priority),
                Number(values.estimatedHours) || 0,
                mondayAssigneeId
              );
              if (mondayItemId) {
                const mondayBoardId = mondayConfig.boardMapping[Number(values.area)];
                console.log('Item creado en Monday:', mondayItemId, 'boardId:', mondayBoardId);
                await db.collection("tickets").doc(result.ticketRef.id).update({ mondayItemId, mondayBoardId });
                
                // Agregar la descripción como primera actualización
                if (values.description && values.description.trim()) {
                  await addMondayUpdate(mondayItemId, `**Descripción del ticket:**\n\n${values.description}`);
                }
              }
            } catch (e) {
              console.error('Error creando item en Monday:', e);
            }
          }
          
          // Add initial comment if provided
          if (values.initialComment && values.initialComment.trim()) {
            const comment = {
              ticketId: result.ticketRef.id,
              comment: values.initialComment.trim(),
              createdDate: new Date(),
              createdBy: $fbuser.uid,
              createdByName: $fbuser.displayName || $fbuser.email || "Usuario",
              isInternal: false
            };
            await db.collection("ticket_comments").add(comment);
          }
          
          loading = false;
          onBack();
        })
        .catch((error) => {
          loading = false;
          Swal.fire({
            title: "Error",
            text: "Error al crear el ticket: " + error.message,
            type: "error",
            confirmButtonColor: "#f46a6a",
          });
        });
    } else {
      // Ensure numeric types for fields before update
      values.area = Number(values.area);
      values.category = Number(values.area);
      values.requestingArea = Number(values.requestingArea);
      // If the user is not admin/support and this is an edit, preserve original priority/status
      if (exists && !($permissions.admin || $permissions.support)) {
        // Keep original values to prevent unauthorized changes
        values.priority = Number(old.priority);
        values.status = Number(old.status);
      } else {
        values.priority = Number(values.priority);
        values.status = Number(values.status);
      }
        // issueType only exists for area == 0, coerce if present
        if (values.issueType !== undefined && values.issueType !== null) {
          values.issueType = Number(values.issueType);
        }
        // hours fields
        values.estimatedHours = Number(values.estimatedHours) || 0;
        values.finalHours = Number(values.finalHours) || 0;
        // If requestingArea is Estancias, set branchId and branchName
        if (values.requestingArea == 7 && values.branchIndex !== undefined && branches[values.branchIndex]) {
          values.branchId = branches[values.branchIndex].id;
          values.branchName = branches[values.branchIndex].name;
        }
        // If sprintIndex is selected, set sprintId
        if (values.sprintIndex !== undefined && values.sprintIndex > 0 && sprints[values.sprintIndex - 1]) {
          values.sprintId = sprints[values.sprintIndex - 1].id;
        } else {
          values.sprintId = null;
        }
      values.lastUpdated = new Date();
      values.lastUpdatedBy = $fbuser.uid;
      values.lastUpdatedByName = $fbuser.displayName || $fbuser.email || "Usuario";

      // Check if status changed and add automatic comment
      if (old.status !== values.status) {
        const statusNames = {
          0: "Abierto",
          1: "En Progreso", 
          2: "Resuelto",
          3: "Cerrado",
          4: "Cancelado"
        };
        
        const statusComment = {
          ticketId: tempId,
          comment: `Estado cambiado de "${statusNames[old.status] || 'Desconocido'}" a "${statusNames[values.status] || 'Desconocido'}"`,
          createdDate: new Date(),
          createdBy: $fbuser.uid,
          createdByName: $fbuser.displayName || $fbuser.email || "Usuario",
          isInternal: true,
          isSystemGenerated: true
        };
        
        db.collection("ticket_comments").add(statusComment);
      }

      // Determine if assignment changed (only meaningful for approved tickets)
      const assignedChanged = ((old.assignedTo || '') !== (values.assignedTo || '')) && (values.status !== 0);

      db.collection("tickets")
        .doc(tempId)
        .update(values)
        .then(async () => {
          loading = false;

          // Sincronizar con Monday si el ticket tiene un item vinculado
          if (values.mondayItemId && mondayToken) {
            try {
              const mondayAssigneeId = values.assignedToEmail
                ? await getMondayUserId(values.assignedToEmail)
                : null;
              await updateMondayItem(
                values.mondayItemId,
                Number(values.status),
                Number(values.priority),
                Number(values.estimatedHours) || 0,
                Number(values.finalHours) || 0,
                mondayAssigneeId
              );
            } catch (e) {
              console.error('Error sincronizando con Monday:', e);
            }
          }

          // If assignment changed, send assignment email to the new assignee
          if (assignedChanged && values.assignedToEmail) {
              try {
              // Use API base that points to the PHP server in local dev
              const apiBase = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:8001' : '';
              await fetch(apiBase + '/send_ticket_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ticketId: tempId,
                  ticketNumber: values.ticketNumber || tempId,
                  title: values.title,
                  description: values.description,
                  // Prefer sending stored createdBy info from the ticket if available
                  createdByName: values.createdByName || values.reportedByName || ($fbuser ? ($fbuser.displayName || $fbuser.email) : ''),
                  createdByEmail: values.createdByEmail || values.reportedBy || ($fbuser ? ($fbuser.email || '') : ''),
                  // Send ticket metadata so backend can render human-readable labels
                  requestingArea: Number(values.requestingArea),
                  priority: Number(values.priority),
                  status: Number(values.status),
                  branchName: values.branchName || null,
                  createdDateString: values.createdDateString || null,
                  // Assigned user info
                  assignedTo: values.assignedTo || null,
                  assignedToName: values.assignedToName || null,
                  to_email: values.assignedToEmail || null,
                  subject: 'Asignación: Ticket #' + (values.ticketNumber || tempId)
                })
              });
            } catch (e) {
              console.error('Error enviando email de asignación', e);
            }
          }

          onBack();
        })
        .catch((error) => {
          loading = false;
          Swal.fire({
            title: "Error",
            text: "Error al actualizar el ticket: " + error.message,
            type: "error",
            confirmButtonColor: "#f46a6a",
          });
        });
    }
  }

  function setField(field, value) {
    values[field] = value;
    values = values;
  }

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
        .toLocaleString(DateTime.DATETIME_MED);
    }
    return DateTime.fromISO(timeStr)
      .setLocale("es-mx")
      .toLocaleString(DateTime.DATETIME_MED);
  }
</script>

<div class="page-content modal-body">
  <TitleBar title={tempId ? "Editar Ticket" : "Crear Ticket"} base="Administración" />
  <form id="form">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">
              {#if tempId}
                Ticket #{values.ticketNumber || tempId}
              {:else}
                Nuevo Ticket
              {/if}
            </h4>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Información General</h3>

            <div class="form-group row">
              <label for="ticketNumber" class="col-md-3 col-form-label">Número de Ticket</label>
              <div class="col-md-9 input-group">
                <input
                  type="text"
                  class="form-control"
                  id="ticketNumber"
                  bind:value={values.ticketNumber}
                  readonly
                  placeholder={tempId ? "Cargando..." : "Se generará automáticamente al guardar"}
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="title" class="col-md-3 col-form-label">Título *</label>
              <div class="col-md-9 input-group">
                <input
                  type="text"
                  class="form-control"
                  id="title"
                  bind:value={values.title}
                  required
                  placeholder="Título descriptivo del ticket"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="description" class="col-md-3 col-form-label">Descripción *</label>
              <div class="col-md-9">
                <textarea
                  class="form-control"
                  id="description"
                  rows="4"
                  bind:value={values.description}
                  required
                  placeholder="Describa detalladamente el problema o solicitud"
                ></textarea>
              </div>
            </div>

            <div class="form-group row">
              <label for="supportDocument" class="col-md-3 col-form-label">Documentos de Soporte</label>
              <div class="col-md-9">
                {#if tempId}
                  <AttachmentsManager 
                    ticketId={tempId} 
                    attachments={values.attachments || {}}
                    canEdit={true}
                  />
                {:else}
                  <div class="alert alert-info">
                    <i class="mdi mdi-information"></i>
                    Guarde el ticket primero para poder adjuntar documentos de soporte.
                  </div>
                {/if}
              </div>
            </div>

            <div class="form-group row">
              <label for="requestingArea" class="col-md-3 col-form-label">Área solicitante</label>
              <div class="col-md-4">
                <ListSelect
                  options={areaOptions}
                  bind:value={values.requestingArea}
                  inlist={false}
                  required
                />
              </div>
            </div>

            {#if Number(values.requestingArea) === 7}
            <div class="form-group row">
              <label for="branch" class="col-md-3 col-form-label">Estancia</label>
              <div class="col-md-4">
                <ListSelect
                  options={branches.map(b => b.name)}
                  bind:value={values.branchIndex}
                  inlist={false}
                  required
                />
              </div>
            </div>
            {/if}

            <div class="form-group row">
              <label for="area" class="col-md-3 col-form-label">Área a asignar</label>
              <div class="col-md-4">
                <ListSelect
                  options={areaOptions}
                  bind:value={values.area}
                  inlist={false}
                  required
                />
              </div>
            </div>


            {#if exists && ($permissions.admin || $permissions.support)}
            <div class="form-group row">
              <label for="assignedToSelect" class="col-md-3 col-form-label">Asignar a</label>
              <div class="col-md-4">
                <ListSelect
                  options={users.map(u => `${u.name}`)}
                  bind:value={assignedIndex}
                  inlist={false}
                />
              </div>
              <div class="col-md-5">
                {#if assignedIndex >= 0 && users[assignedIndex]}
                  <small class="text-muted">Email: {users[assignedIndex].email}</small>
                {/if}
              </div>
            </div>
            {/if}

            {#if Number(values.area) === 0}
            <div class="form-group row">
              <label for="issueType" class="col-md-3 col-form-label">Tipo de incidencia</label>
              <div class="col-md-4">
                <ListSelect
                  options={issueTypes}
                  bind:value={values.issueType}
                  inlist={false}
                  required
                />
              </div>
            </div>
            {/if}

            <div class="form-group row">
              <label for="sprint" class="col-md-3 col-form-label">Sprint</label>
              <div class="col-md-4">
                <ListSelect
                  options={['Sin asignar', ...sprints.map(s => `${s.name} (${s.status === 'active' ? 'Activo' : 'Planificado'})`)]}
                  bind:value={values.sprintIndex}
                  inlist={false}
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="priority" class="col-md-3 col-form-label">Prioridad</label>
              <div class="col-md-4">
                <ListSelect
                  options={priorityOptions}
                  bind:value={values.priority}
                  disabled={exists && !($permissions.admin || $permissions.support)}
                  inlist={false}
                  required
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="status" class="col-md-3 col-form-label">Estado</label>
              <div class="col-md-4">
                <ListSelect
                  options={statusOptions}
                  bind:value={values.status}
                  disabled={exists && !($permissions.admin || $permissions.support)}
                  inlist={false}
                  required
                />
              </div>
            </div>

            {#if $permissions.admin}
            <div class="form-group row">
              <label for="estimatedHours" class="col-md-3 col-form-label">Estimación (horas)</label>
              <div class="col-md-4">
                <input type="number" step="0.25" min="0" class="form-control" id="estimatedHours" bind:value={values.estimatedHours} />
              </div>
            </div>

            <div class="form-group row">
              <label for="finalHours" class="col-md-3 col-form-label">Horas finales</label>
              <div class="col-md-4">
                <input type="number" step="0.25" min="0" class="form-control" id="finalHours" bind:value={values.finalHours} />
              </div>
            </div>
            {/if}

            <!-- {#if $permissions.admin || $permissions.support}
            <div class="form-group row">
              <label for="assignedTo" class="col-md-3 col-form-label">Asignado a</label>
              <div class="col-md-9 input-group">
                <input
                  type="text"
                  class="form-control"
                  id="assignedTo"
                  bind:value={values.assignedTo}
                  placeholder="ID del usuario asignado"
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="assignedToName" class="col-md-3 col-form-label">Nombre del asignado</label>
              <div class="col-md-9 input-group">
                <input
                  type="text"
                  class="form-control"
                  id="assignedToName"
                  bind:value={values.assignedToName}
                  placeholder="Nombre completo del usuario asignado"
                />
              </div>
            </div>
            {/if} -->

            {#if !tempId}
            <div class="form-group row">
              <label for="initialComment" class="col-md-3 col-form-label">Comentario inicial</label>
              <div class="col-md-9">
                <textarea
                  class="form-control"
                  id="initialComment"
                  rows="3"
                  bind:value={values.initialComment}
                  placeholder="Información adicional sobre el ticket"
                ></textarea>
              </div>
            </div>
            {/if}

            {#if tempId}
            <div class="form-group row">
              <label for="estimatedResolution" class="col-md-3 col-form-label">Resolución estimada</label>
              <div class="col-md-9">
                <input
                  type="datetime-local"
                  class="form-control"
                  id="estimatedResolution"
                  bind:value={values.estimatedResolution}
                />
              </div>
            </div>

            <div class="form-group row">
              <label for="resolution" class="col-md-3 col-form-label">Resolución</label>
              <div class="col-md-9">
                <textarea
                  class="form-control"
                  id="resolution"
                  rows="3"
                  bind:value={values.resolution}
                  placeholder="Descripción de cómo se resolvió el ticket"
                ></textarea>
              </div>
            </div>
            {/if}

          </div>
        </div>
      </div>
    </div>

    {#if tempId && exists}
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Información del Reporte</h3>
            
            <div class="form-group row">
              <label class="col-md-3 col-form-label">Reportado por:</label>
              <div class="col-md-9 col-form-label">
                {values.reportedByName || "Usuario desconocido"}
              </div>
            </div>

            <div class="form-group row">
              <label class="col-md-3 col-form-label">Fecha de creación:</label>
              <div class="col-md-9 col-form-label">
                {timeFormated(values.createdDate)}
              </div>
            </div>

            {#if values.lastUpdated}
            <div class="form-group row">
              <label class="col-md-3 col-form-label">Última actualización:</label>
              <div class="col-md-9 col-form-label">
                {timeFormated(values.lastUpdated)} por {values.lastUpdatedByName || "Usuario desconocido"}
              </div>
            </div>
            {/if}

          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h3>Comentarios</h3>
            
            <div class="mb-3">
              <div class="form-group">
                <textarea
                  class="form-control"
                  rows="3"
                  bind:value={newComment}
                  placeholder="Agregar un comentario..."
                ></textarea>
              </div>
              <button
                type="button"
                class="btn btn-primary"
                on:click={addComment}
                disabled={!newComment.trim()}
              >
                Agregar Comentario
              </button>
            </div>

            <div class="comments-section">
              {#each comments as comment}
                <div class="card mb-2 {comment.isInternal ? 'border-warning' : ''}">
                  <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{comment.createdByName}</strong>
                        {#if comment.isInternal}
                          <span class="badge badge-warning ml-1">Interno</span>
                        {/if}
                        {#if comment.isSystemGenerated}
                          <span class="badge badge-info ml-1">Sistema</span>
                        {/if}
                      </div>
                      <small class="text-muted">{timeFormated(comment.createdDate)}</small>
                    </div>
                    <p class="mb-0 mt-1">{comment.comment}</p>
                  </div>
                </div>
              {/each}
              
              {#if comments.length === 0}
                <p class="text-muted">No hay comentarios aún.</p>
              {/if}
            </div>

          </div>
        </div>
      </div>
    </div>
    {/if}

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
            {#if loading}<i class="bx bx-hourglass bx-spin font-size-16 align-middle me-2"></i>{/if}
            {tempId ? "Actualizar" : "Crear Ticket"}
          </button>
          {#if loading}
            <div class="spinner-grow text-secondary m-1" role="status">
              <span class="sr-only">Cargando...</span>
            </div>
          {/if}
          <button
            on:click={cancel}
            class="btn btn-light waves-effect waves-light"
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}