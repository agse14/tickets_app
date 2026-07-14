<script>
    import TitleBar from "../TitleBar.svelte";
    import WorkersSearchListFiltered from "../controls/WorkersSearchListFiltered.svelte";
    import { link } from "svelte-spa-router";
    import { pop } from "svelte-spa-router";
    import swal from 'sweetalert';
    import PositionsSearchList from "../controls/PositionsSearchList.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { positions } from '../controls/positions.js';
    import { permissions } from "../stores.js";

  export let bid;

  let positionsId = [];
  let workpositions = [];
//   let positions = [];
  let positionsNames = [];
  let unsubBranch;
  let residents = 0;
  let posAsign = {};
  let weekNew = [];
  let nightShift = '';
  let pos = {};
  let shiftLimitsReached = {}; // Para manejar el estado de límites alcanzados

  $: bid, getWOrkroles();

  // Función reactiva para verificar límites cuando cambian los datos
  $: {
      // console.log("🔄 DEBUG: Reactive block triggered - workpositions.length:", workpositions.length, "bid:", bid);
      if (workpositions.length > 0 && bid) {
          // console.log("🚀 DEBUG: Calling updateShiftLimitsStatus");
          updateShiftLimitsStatus();
      } else {
          // console.log("❌ DEBUG: No calling updateShiftLimitsStatus - conditions not met");
      }
  }

  async function updateShiftLimitsStatus() {
      // console.log("🔍 DEBUG: Actualizando estado de límites de guardias");
      const newLimitsStatus = {};
      for (const position of workpositions) {
          // console.log(`📋 DEBUG: Posición ${position.id} - limitShifts: ${position.limitShifts}`);
          if (position.limitShifts !== undefined && position.limitShifts > 0) {
              const limitReached = await hasReachedShiftLimit(position.id);
              newLimitsStatus[position.id] = limitReached;
              // console.log(`✅ DEBUG: Posición ${position.id} - Límite alcanzado: ${limitReached}`);
          } else {
              // console.log(`❌ DEBUG: Posición ${position.id} - Sin límite configurado o límite <= 0`);
          }
      }
      shiftLimitsReached = newLimitsStatus;
      // console.log("🎯 DEBUG: Estado final de límites:", shiftLimitsReached);
  }

  // Función para verificar si una posición ha alcanzado su límite de guardias mensual
  async function hasReachedShiftLimit(positionId) {
      // console.log(`🚀 DEBUG: Verificando límite para posición ${positionId}`);
      
      const position = workpositions.find(pos => pos.id === positionId);
      if (!position || position.limitShifts === undefined || position.limitShifts <= 0) {
          // console.log(`❌ DEBUG: Posición ${positionId} - No encontrada o sin límite válido`);
          return false;
      }

      // console.log(`📊 DEBUG: Posición ${positionId} - Límite configurado: ${position.limitShifts} guardias`);

      // Obtener el mes actual
      const currentDate = DateTime.local().setLocale("es-mx");
      const startOfMonth = currentDate.startOf('month').toISODate();
      const endOfMonth = currentDate.endOf('month').toISODate();
      
      // console.log(`📅 DEBUG: Rango del mes actual: ${startOfMonth} a ${endOfMonth}`);
      // console.log(`🏢 DEBUG: Branch ID: ${bid}`);
      
      try {
          // Consultar todas las asignaciones del mes actual desde Firebase
          const snapshot = await db.collection("asignments")
              .where("branches", "==", bid)
              .where("dayId", ">=", startOfMonth)
              .where("dayId", "<=", endOfMonth)
              .get();

          // console.log(`📋 DEBUG: Total de documentos encontrados: ${snapshot.size}`);

          let totalShifts = 0;
          let dayShifts = 0;
          let nightShifts = 0;

          snapshot.forEach((doc) => {
              const data = doc.data();
              // console.log(`📄 DEBUG: Documento ${doc.id} - dayId: ${data.dayId}`);
              // console.log(`📄 DEBUG: Estructura del documento:`, data);
              // console.log(`📄 DEBUG: data.day:`, data.day);
              // console.log(`📄 DEBUG: data.night:`, data.night);
              // console.log(`📄 DEBUG: Buscando posición ${positionId} en data.day[${positionId}]:`, data.day ? data.day[positionId] : 'undefined');
              // console.log(`📄 DEBUG: Buscando posición ${positionId} en data.night[${positionId}]:`, data.night ? data.night[positionId] : 'undefined');
              
              // Contar guardias diurnas
              if (data.day && data.day[positionId] && data.day[positionId] !== "") {
                  dayShifts++;
                  totalShifts++;
                  // console.log(`☀️ DEBUG: Guardia diurna encontrada - Trabajador: ${data.day[positionId]} - Día: ${data.dayId}`);
              }
              
              // Contar guardias nocturnas
              if (data.night && data.night[positionId] && data.night[positionId] !== "") {
                  nightShifts++;
                  totalShifts++;
                  // console.log(`🌙 DEBUG: Guardia nocturna encontrada - Trabajador: ${data.night[positionId]} - Día: ${data.dayId}`);
              }
          });

          // console.log(`📊 DEBUG: RESUMEN para posición ${positionId}:`);
          // console.log(`   - Guardias diurnas: ${dayShifts}`);
          // console.log(`   - Guardias nocturnas: ${nightShifts}`);
          // console.log(`   - Total guardias: ${totalShifts}`);
          // console.log(`   - Límite configurado: ${position.limitShifts}`);
          // console.log(`   - ¿Límite alcanzado?: ${totalShifts >= position.limitShifts}`);

          return totalShifts >= position.limitShifts;
      } catch (error) {
          console.error("❌ DEBUG: Error checking shift limits:", error);
          return false;
      }
  }
    
  function getWOrkroles(){
      if(unsubBranch != undefined){
        unsubBranch();
      }
      if(bid == undefined || bid == ""){
          return;
      }
    // 🔄 Hacer la consulta reactiva para detectar cambios en limitShifts
    let unsubWorkroles = db.collection("workroles")
    .where("branches","==",bid)
    .orderBy("pay","desc").onSnapshot(async (querySnapshot) => { 
    
        const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // // console.log(`${doc.id} => ${doc.data()}`);
                const temppositions = doc.data();
                temppositions.id = doc.id;
                tmp.push(temppositions);
            });
            workpositions = tmp;
            // console.log("🔄 DEBUG: Workroles actualizados", workpositions)
            pos = workpositions.id;
            let shift = tmp.find(shift => shift.shift_night == "1");
            nightShift = shift;
            
            // 🔄 Recalcular límites cuando cambien los workroles
            // console.log("🔄 DEBUG: Workroles cambiaron, recalculando límites");
            if (workpositions.length > 0 && bid) {
                updateShiftLimitsStatus();
            }
            // // console.log(nightShift);
    });
    unsubBranch= db.collection("branches").doc(bid).onSnapshot((querySnapshot) => { 
    
        if(querySnapshot.exists){
            residents = querySnapshot.data().residents;
        }
    });

  }
  
  //Aqui generar los ids con la libreria . ej en CaptureInventory.svelte
    //startOf('week') esta funcion te lleva al incio de la semana;
  let cdate = DateTime.local()
            .setLocale("es-mx").startOf('week');
            //// console.log(cdate);
               
 initWeek();

function initWeek() {
    //let dayId = cdate.toISODate();
    //ESTO solo jala cuando ya se habia asignado una semana
    for (let wd = 0; wd < weekNew.length; wd++) {
        const element = weekNew[wd];
        if(element.unsub != undefined){
            element.unsub();
            element.unsub = null;
        }
    }

    //reseteo la semana
    weekNew = [];
    // me voy del lunes al dia 7
    for (let index = 0; index < 7; index++) {
        // al dia de inicio de semana le sumo index dias
        let dayNext = cdate.plus({days: index});
        //saco el id
        const dId = dayNext.toISODate();
        posAsign[dId] = {};
        posAsign[dId].branches = bid;
        posAsign[dId].dayId = dId;
        posAsign[dId].day = {};
        posAsign[dId].night = {};

        //carga las asignaciones de la semana
        var unsubwek= db.collection("asignments")
        .where('dayId',"==",dId)
        .where('branches',"==",bid)
        .onSnapshot((querySnapshot) => { 
            for (let wd = 0; wd < weekNew.length; wd++) {
                const element = weekNew[wd];
                if(element.id == dId){
                    element.loading = false;
                    let foundDoc = false;
                    // // console.log('found assigments '+dId, querySnapshot.size);
                    querySnapshot.forEach(function(doc) {
                            // doc.data() is never undefined for query doc snapshots
                            const data = doc.data();
                            if(data.branches== bid){
                                foundDoc = true;
                                posAsign[dId] = data;
                                if(posAsign[dId].day == undefined){
                                    posAsign[dId].day = {};
                                }
                                if(posAsign[dId].night == undefined){
                                    posAsign[dId].night = {};
                                }
                                
                            }else{
                                element.asigned = [...element.asigned, ...Object.values(data)];
                            }
                            
                        });
                    if(!foundDoc){
                        posAsign[dId].added = timenow;

                        element.added = true;
                    }
                }
            }
            weekNew = weekNew;
            
            // 🔄 Trigger para actualizar límites cuando cambien las asignaciones
            // console.log("🔄 DEBUG: Asignaciones actualizadas, recalculando límites");
            if (workpositions.length > 0 && bid) {
                updateShiftLimitsStatus();
            }
           
        });
        
        weekNew.push({
            date: dayNext,
            id: dId,
            unsub: unsubwek,
            asigned:[],
            added:false,
            loading: true
        });
        
    }
    weekNew = weekNew;
    
}
    
function prevWeek(){
    cdate = cdate.minus({days: 7});
    // // console.log(cdate);
    initWeek();
}       

function nextWeek(){
    cdate = cdate.plus({days: 7});
    // // console.log(cdate);
    initWeek();
}  
    
function asyncChange(id, field, newval){
    
    var update = {};
    update[field] = newval;
    db.collection("branches").doc(id).update(update);
}
//checa que jale
function addPaidPostition(){
    let payPos={
        branches: "A4JNT4BK8ScnTNhsF9XZ",
        id: "paid-"+workpositions.length,
        pay: 0,
        paid:true,
        positions: "SOZJKwbEJZrwW2B974T4",
    };
    workpositions.push(payPos);
    workpositions = workpositions;
}
//checa que jale
async function asigninWeekDay(dId, pId){
    // console.log('🚀 DEBUG: asigninWeekDay - Día:', dId, 'Posición:', pId);
    
    // Verificar el límite de guardias mensual para turnos de día
    const position = workpositions.find(pos => pos.id === pId);
    // console.log('📋 DEBUG: Posición encontrada:', position);
    
    if (position && position.limitShifts !== undefined) {
        // console.log(`🔍 DEBUG: Verificando límite para posición ${pId} - Límite: ${position.limitShifts}`);
        const limitReached = await hasReachedShiftLimit(pId);
        // console.log(`✅ DEBUG: Resultado límite alcanzado: ${limitReached}, Es admin: ${$permissions.admin}`);
        
        if (limitReached && !$permissions.admin) {
            // console.log('🚫 DEBUG: Bloqueando asignación - Límite alcanzado y no es admin');
            swal(
                "Límite mensual alcanzado",
                `El puesto ha alcanzado su límite mensual de ${position.limitShifts} guardias diurnas.`,
                "warning"
            );
            return;
        }
    }
    
    let foundDay = false;
    let userId = "";
    for (let index = 0; index < weekNew.length; index++) {
        const element = weekNew[index];
        if(element.id == dId){
            //// console.log('foundDay');
            foundDay = true;
            userId = posAsign[dId].day[pId];
        }else if(foundDay){
            posAsign[element.id].day[pId] = userId;
        }

        
    }
    posAsign = posAsign;
}

async function asigninWeekNight(dId, pId){
    // console.log('🌙 DEBUG: asigninWeekNight - Día:', dId, 'Posición:', pId);
    
    // Verificar el límite de guardias mensual para turnos de noche
    const position = workpositions.find(pos => pos.id === pId);
    // console.log('📋 DEBUG: Posición encontrada:', position);
    
    if (position && position.limitShifts !== undefined && position.shift_night) {
        // console.log(`🔍 DEBUG: Verificando límite nocturno para posición ${pId} - Límite: ${position.limitShifts}`);
        const limitReached = await hasReachedShiftLimit(pId);
        // console.log(`✅ DEBUG: Resultado límite alcanzado: ${limitReached}, Es admin: ${$permissions.admin}`);
        
        if (limitReached && !$permissions.admin) {
            // console.log('🚫 DEBUG: Bloqueando asignación nocturna - Límite alcanzado y no es admin');
            swal(
                "Límite mensual alcanzado",
                `El puesto ha alcanzado su límite mensual de ${position.limitShifts} guardias nocturnas.`,
                "warning"
            );
            return;
        }
    }
    
    let foundDay = false;
    let userId = "";
    for (let index = 0; index < weekNew.length; index++) {
        const element = weekNew[index];
        if(element.id == dId){
            //// console.log('foundDay');
            foundDay = true;
            userId = posAsign[dId].night[pId];
        }else if(foundDay){
            posAsign[element.id].night[pId] = userId;
        }

        
    }
    posAsign = posAsign;
}
//otra funcion para guardar el posAsign[deldia] en firebase en "asignments", agregandole el branchid 
function saveDay(dId, pos){
    // // console.log(weekNew, workpositions,posAsign[dId]);
        var selPositions = posAsign[dId].day;
        var selPositionsNight = posAsign[dId].night;
        var result = "";
        var resultnight = "";

        // console.log(posAsign[dId].day);
        // // console.log(selPositions);
        // console.log(pos);
        //if night selPositions = posAsign.[dId].night;
        for (let index = 0; index < Object.keys(selPositions).length; index++) {
            const key = Object.keys(selPositions)[index];
            const element = selPositions[key];
            // // console.log(element);
            // // console.log(selPositions);
            if(element == ""){
                // result +=  key;
                for (let index = 0; index < workpositions.length; index++) {
                    const wrkpos = workpositions[index];
                    // // console.log(wrkpos.id)
                    //for $positons para sacar el .name
                    if(key == wrkpos.id){
                        $positions.forEach(reg => {
                            if(reg.id == wrkpos.positions){
                                result += reg.name+ ", ";
                                // console.log(result);
                            }                            
                        });
                    }
                }
            }    
        }
        for (let index = 0; index < Object.keys(selPositionsNight).length; index++) {
            const key = Object.keys(selPositionsNight)[index];
            const element = selPositionsNight[key];
            // console.log(element);
            // console.log(selPositionsNight);
            if(element == ""){
                // result +=  key;
                for (let index = 0; index < workpositions.length; index++) {
                    const wrkpos = workpositions[index];
                    // // console.log(wrkpos.id)
                    //for $positons para sacar el .name
                    if (wrkpos.shift_night == true) {
                        if(key == wrkpos.id){
                            $positions.forEach(reg => {
                                if(reg.id == wrkpos.positions){
                                    resultnight += reg.name+ " (noche), ";
                                    // console.log(resultnight);
                                }                            
                            });
                        }
                    }     
                }
            }    
        }
                    // alert("res: "+result);
    Swal.fire({
        title: "¿Esta seguro?",
        text: "Desea asignar este día, con estas vacantes faltantes: "+result+" "+resultnight,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#34c38f",
        cancelButtonColor: "#f46a6a",
        confirmButtonText: "Si, guardar!"
        }).then(async function (result) {
        if (result.value) {
            
            await db.collection("asignments")
            .add(posAsign[dId]);
            for (let index = 0; index < weekNew.length; index++) {
                const element = weekNew[index];
                if(element.id == dId){
                    element.added = false;
                }
                if (element.asigned) {
                    for (let index = 0; index < workpositions.length; index++) {
                        const element = workpositions[index];
                    }
                }
            }
            weekNew = weekNew;
        }
    });
}
</script>
<div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="col">
                            <h3>Calendario <BranchesSearchList value={bid} inlist={true} /></h3>
                    </div>
                        <div class="col">
                            <h6>Residentes Actuales</h6>
                            <b>{residents}</b>
                        </div>
                        <div class="col">
                            <button class="btn btn-primary waves-effect waves-light" on:click={addPaidPostition}>
                                Agregar Posición Pagada
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  <div class="card">
    <div class="card-body">
        <div class="row mb-4">
            <div class="col"></div>
            <div class="col-5 text-center"><h3>Turno de Día</h3></div>
            <div class="col"></div>
        </div>
        <div class="row mb-4">
            <div class="col"></div>
            <div class="col-1"><a href="javascript:void(0);" class="btn btn-light waves-effect" on:click={()=>{ prevWeek() }}><i class="bx bx-chevron-left font-size-16 align-middle"></i></a></div>
            <div class="col-5"><h4>Semana {weekNew[0].date.day} de {weekNew[0].date.monthLong} al {weekNew[6].date.day} de {weekNew[6].date.monthLong}</h4></div>
            <div class="col-1"><a href="javascript:void(0);" class="btn btn-light waves-effect" on:click={()=>{ nextWeek() }}><i class="bx bx-chevron-right font-size-16 align-middle"></i></a></div>
            <div class="col"></div>
        </div>
        
        <div class="timeline-count p-4 over">
          <!-- Timeline row Start -->
            <div class="row over">
                {#each weekNew as day}
                    <div class="timeline-box col-lg-3">
                        <div class="timeline-spacing">
                            <div class="item-lable bg-primary rounded">
                                <p class="text-center text-white">{day.date.weekdayLong}</p>
                            </div>
                            <div class="col">
                                <h6 class="text-center">{day.date.day} {day.date.monthLong}</h6>
                            </div>
                            <div class="timeline-line active">
                                <div class="dot bg-primary"></div>
                            </div>
                            <div class="vertical-line">
                                <div class="wrapper-line bg-light"></div>
                            </div>
                            <div class="bg-light p-4 rounded mx-1">
                                <div class="text-muted mb-0">
                                    {#each workpositions as position}
                                        <div class="position-container {shiftLimitsReached[position.id] && !$permissions.admin ? 'position-with-limit' : ''}">
                                            <div class="row">
                                                <div class="row position col-9">
                                                    <PositionsSearchList value={position.positions} inlist={true} />
                                                </div>
                                                <div class="col-3">
                                                    {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                        <button class="btn btn-secondary waves-effect" disabled title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar">
                                                            <i class="bx bx-lock font-size-16 align-middle"></i>
                                                        </button>
                                                    {:else}
                                                        <a href="javascript:void(0);" class="btn btn-light waves-effect" on:click={()=>{ asigninWeekDay(day.id, position.id) }}><i class="bx bx-chevron-right font-size-16 align-middle"></i></a>
                                                    {/if}
                                                </div>
                                            </div>
                                            <div class="row search mb-2">
                                                <div class="col-12">
                                                    <div class="{shiftLimitsReached[position.id] && !$permissions.admin ? 'worker-selector-disabled' : ''}">
                                                        <WorkersSearchListFiltered baseId={"-"+position.id+day.id+"day"} bind:value={posAsign[day.id].day[position.id]} excludeIds={day.asigned} branch={bid} />
                                                    </div>
                                                    {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                        <div class="alert alert-warning mt-2" style="margin-bottom: 0.75rem;">
                                                            <i class="bx bx-info-circle"></i> Límite mensual de guardias alcanzado - Solo administradores pueden modificar
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                    {#if nightShift == '' || nightShift == undefined || nightShift == null}
                                        <button class="btn btn-primary waves-effect waves-light" on:click={()=>{saveDay(day.id, pos);}} disabled={day.loading || !day.added}>
                                            {#if day.loading}
                                                <div class="spinner-grow text-secondary m-1" role="status">
                                                    <span class="sr-only">Cargando...</span>
                                                </div>
                                            {:else}
                                                Guardar día
                                            {/if}
                                        </button>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
            <!-- Timeline row Over -->
            <!-- Timeline row Night_shift --><!-- Timeline row Night_shift --><!-- Timeline row Night_shift -->
            {#if nightShift != '' && nightShift != undefined && nightShift != null}
                <div class="row mb-4">
                    <div class="col"></div>
                    <div class="col-5 text-center"><h3>Turno de Noche</h3></div>
                    <div class="col"></div>
                </div>
                <div class="row over">
                    {#each weekNew as day}
                        <div class="timeline-box col-lg-3">
                            <div class="timeline-spacing">
                                <div class="bg-light p-4 rounded mx-1"> 
                                    <div class="text-muted mb-0">
                                        {#each workpositions as position}
                                            {#if position.shift_night == '1'}
                                                <div class="position-container {shiftLimitsReached[position.id] && !$permissions.admin ? 'position-with-limit' : ''}">
                                                    <div class="row">
                                                        <div class="row position col-9">
                                                            <PositionsSearchList value={position.positions} inlist={true} />
                                                        </div>
                                                        <div class="col-3">
                                                            {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                <button class="btn btn-secondary waves-effect" disabled title="Límite mensual de guardias alcanzado - Solo administradores pueden modificar">
                                                                    <i class="bx bx-lock font-size-16 align-middle"></i>
                                                                </button>
                                                            {:else}
                                                                <a href="javascript:void(0);" class="btn btn-light waves-effect" on:click={()=>{ asigninWeekNight(day.id, position.id) }}><i class="bx bx-chevron-right font-size-16 align-middle"></i></a>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                    <div class="row search mb-2">
                                                        <div class="col-12">
                                                            <div class="{shiftLimitsReached[position.id] && !$permissions.admin ? 'worker-selector-disabled' : ''}">
                                                                <WorkersSearchListFiltered baseId={"-"+position.id+day.id+"night"} bind:value={posAsign[day.id].night[position.id]} excludeIds={day.asigned} branch={bid}/>
                                                            </div>
                                                            {#if shiftLimitsReached[position.id] && !$permissions.admin}
                                                                <div class="alert alert-warning mt-2" style="margin-bottom: 0.75rem;">
                                                                    <i class="bx bx-info-circle"></i> Límite mensual de guardias alcanzado - Solo administradores pueden modificar
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}
                                        {/each}
                                        <button class="btn btn-primary waves-effect waves-light" on:click={()=>{saveDay(day.id);}} disabled={day.loading || !day.added}>
                                            {#if day.loading}
                                                <div class="spinner-grow text-secondary m-1" role="status">
                                                    <span class="sr-only">Cargando...</span>
                                                </div>
                                            {:else}
                                                Guardar día
                                            {/if}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div> 
            {/if}
        </div>
    </div>
</div>
<style>
    .timeline-count{
        overflow-x: auto;
    }
    .row.over{
        flex-wrap: nowrap;
    }
    .mb-2, .my-2 {
    margin-bottom: 0.1rem!important;
    }
    
    /* Excepción para elementos con límites de guardias */
    .position-with-limit .mb-2 {
        margin-bottom: 1.5rem!important;
    }
    
    .row.search{
        max-height: 42px;
        margin-bottom: 0.75rem;
    }
    .row.position{
        max-height: 35px;
        padding-left: 25px;
        margin-bottom: 0.5rem;
    }
    
    /* Ajustar altura para posiciones con límites */
    .position-with-limit .row.position {
        margin-bottom: 0.75rem;
    }
    
    .position-with-limit .row.search {
        margin-bottom: 1rem;
    }
    
    /* Contenedor de posición para mejorar espaciado */
    .position-container {
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
    }
    
    .position-container.position-with-limit {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e9ecef;
    }
    .wrapper-line.bg-light{
        padding-left: 0px !important;
        padding-right: 0px !important;
    }
    .bg-light{
        padding-left: 10px !important;
        padding-right: 10px !important;
    }
    
    /* Estilos para alertas de límites */
    .alert-warning {
        background-color: #fff3cd;
        border-color: #ffeaa7;
        color: #856404;
        border-radius: 0.25rem;
        border: 1px solid;
        margin-bottom: 0.75rem;
        padding: 0.5rem;
        font-size: 0.8rem;
    }
    .alert-warning i {
        margin-right: 5px;
    }
    
    /* Ajustar altura de filas de búsqueda cuando hay alerta */
    .row.search:has(.alert-warning) {
        max-height: auto;
        margin-bottom: 0.75rem;
    }
    
    /* Espaciado adicional para posiciones con límites */
    .row.search {
        margin-bottom: 0.5rem;
    }
    
    /* Deshabilitar selector visualmente */
    .worker-selector-disabled {
        pointer-events: none;
        opacity: 0.6;
        position: relative;
    }
    
    .worker-selector-disabled::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: transparent;
        z-index: 10;
        cursor: not-allowed;
    }
</style>