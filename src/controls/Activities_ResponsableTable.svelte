<script>
    // import TitleBar from "../TitleBar.svelte";
    import Select from 'svelte-select';
    import { fbuser} from "../stores.js";
    import { workers } from './workers.js';

    export let value = "";
    export let uId; 
    export let params = {};
    export let values = {};
    export let tempId = uId;
    export let excludeIds= [];
    export let filter = (row)=>{return true;};
    export let onSelect = null;
    
    let activities = [];
    let name;
    let empty;
    let lenght;
    let today = DateTime.local()
            .setLocale("es-mx");
    let query;
    let time = today.toISOTime();
    let rows;
    let allRows;
    let valueObject;

    if (!tempId) {
      console.log("Error! No hay un paciente seleccionado");
    }else{
      db.collection("patients")
      .doc(tempId)
      .get()
      .then((snap)=>{
        if(snap.exists){
            name = snap.data().name;
        }
      });
      query = db.collection("cardActivities")
        .where('patient',"==",tempId)
        .where('dayId',"==",today.toISODate())
        .orderBy('time','asc')
        .onSnapshot((result) => {
            activities = [];
            result.forEach((doc) => {
                console.log(doc.data());
                const tempactivity = doc.data();
                tempactivity.id = doc.id;
                activities.push(tempactivity);
                
                lenght = activities.length;
                console.log(lenght);
            }); 
            activities = activities;
            // console.log("on snap test",activities);   
        });
    }
    function done(aId) {
        console.log("done", aId);
        db.collection("cardActivities")
        .doc(aId)
        .update({checkActivity:true, 
            checkDate:new Date(), 
            checkby: $fbuser.uid,
            checkName: $fbuser.displayName ?? ''
        });
        
    }

    function updateSelect2(){
        rows = [];
        for (let d = 0; d < allRows.length; d++) {
            const element = allRows[d];
            const op = {value:element.id, label:element.name};
            if(!excludeIds.includes(element.id) && filter(element)){
            
            if(element.id == value){
                valueObject = op;
            }
            rows.push(op);
            }
            
        }
    }

    function handleSelect(event){
        const val = event.detail;
        //console.log(val);
        value = val.value;
        if(onSelect != null && typeof onSelect === 'function'){
            allRows.forEach(element => {
                        if(element.id == value){
                        onSelect(element);
                        //console.log(element);
                        }
                    });
        }
    }

    function handleClear(event) {
        value = "";
    }
    
    const unsubscribe = workers.subscribe(data => {
        allRows = data;
        updateSelect2();
    });
</script>
<div class="card-body">
    <h2>{name}</h2>
    <h4>{today.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</h4>
    <div class="div">
        <Select items={rows} value={valueObject} on:select={handleSelect} on:clear={handleClear}></Select>
    </div>
        <table class="cal" style="width:100%">
            <thead>
                <tr>
                    <th>Horario</th>
                    <th class="activity">ACTIVIDAD</th>
                    <th>Completada?</th>
                </tr>
            <tbody>
                {#each activities as activity}
                
                    <tr>
                        <td class="horas">{activity.time}</td>
                        <td class="actividad" class:under={activity.checkActivity} class:past={!activity.checkActivity && activity.time < time}>
                            {activity.name}
                            {#if activity.notes != undefined}
                                <br />
                                <small>{activity.notes}</small>
                            {/if}
                        </td>
                        <td>
                            <div class="custom-control custom-checkbox">
                                <input type="checkbox" class="custom-control-input" id="check{activity.id}"  on:click={()=>{done(activity.id);}} disabled={!activity.checkActivity}>
                                <label class="custom-control-label" for="check{activity.id}">Hecho</label>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
</div>

<style type="text/css" media="print">
    .card-body{
        padding: 1em;
        width: 100%;
    }
    table{
        border-collapse: unset;
    }
    table.cal {
        display:inline-block;
        min-height:600px;
        width:97%;
        color: #707d8a;
        border-spacing:0;
    }
    thead> tr > th { 
        display:in-line;	
        /* width:30%; */
        margin: 2%;
        /* padding:2%; */
        color: white;
        background: #9c9d36;
        height:40px;
        border: 2px outset white;
        vertical-align:middle;
        text-align: center;
        border-radius: 10px;
    }

    tr:nth-child(odd) {
        
        border-radius: 10px 10px 10px 10px;
        padding:1%;
        margin:1%;
    }
    tr:nth-child(even) {
        border-radius: 10px 10px 10px 10px;
        padding:1%;
        margin:1%;
    }
    tr:last-child {
        border-radius: 0 0 10px 10px;
        padding:1%;
        margin:1%;
    }
    tr:last-child > td:first-child {
        border-radius: 10px ;
        padding:1%;
        margin:1%;
    }
    tr:last-child > td:last-child {
        padding:1%;
        margin:1%;
        border-radius: 10px;
    }

    table.cal>tbody> th,td
    {
        display:in-line;	
        /* width:30%; */
        margin: 2%;
        padding:2%;
        height:40px;
        border: 2px outset white;
        vertical-align:middle;
        text-align: center;
        border-radius: 10px;
    }
    th {
        text-align: center;
        background: #ffffff;
        border: 2px outset;
        /* grey;  */
        
    }

    .activity{
        margin: 0;
        padding: 0;
        /* background-color:#FFD180 ;  */
        width: 600px;
    }
    .check{
        margin: 0;
        padding: 0;
        background-color:#ffffff ; 
        width: 100px important;
    }
    .under{
        text-decoration: line-through;
    }
    .past{
        color:#800000;
    }
    .horas{
        margin: 0;
        padding: 0;
        background-color:#ffffff ;
    }
    .actividad {
        padding: 0;
        margin: 0;
        background-color: #ffffff;
        }
    span {
        display: block;
        text-align: center;
        color: #800000;
        visibility: hidden;
    }
    td:active > span {
        visibility: visible;
    }
  </style>
