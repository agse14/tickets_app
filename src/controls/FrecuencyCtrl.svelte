<script>
    import {TimePicker} from 'svelte-time-picker'
    import FrequencyListSelect from './FrequencyListSelect.svelte';
    import ListSelect from "./ListSelect.svelte"
    // v1: import TimePicker from 'svelte-time-picker'
  
    export let data = {};

    $: data.ftype, data.pdays, data.phours, data.pday, data.frequency, data.frecuency_amount, calulatePeriod();

    data.start = DateTime.local().startOf('hour').plus({hour:1}).toISO({ includeOffset: false });
    function calulatePeriod(){
      if(data.ftype == 0){
        data.period = 0;
        
      }
      if(data.ftype == 1){
        data.period = (data.phours ?? 8);
      }
      if(data.ftype == 2){
        data.period = (data.pday ?? 1) * 24;
      }
      if(data.ftype == 3){
        data.period = 24* 7;
        if(data.pdays == undefined){
          return;
        }
        const dayINeed = data.pdays; // for Thursday
        const today = DateTime.local().weekday;
        const selDay = DateTime.fromISO(data.start).weekday;
        // if we haven't yet passed the day of the week that I need:
        if(selDay != dayINeed){
          if (today <= dayINeed) { 
            // then just give me this week's instance of that day
            data.start = DateTime.local().plus({days:dayINeed- today}).startOf('hour').plus({hour:1}).toISO({ includeOffset: false });
          } else {
            // otherwise, give me *next week's* instance of that same day
            data.start = DateTime.local().plus({days:7+dayINeed- today}).startOf('hour').plus({hour:1}).toISO({ includeOffset: false });
          }
        }
        
      }

      if(data.frequency == 2 || data.frequency == 3){
        data.endDate = '';
        //data = data;
        return;

      }
      console.log("f",data.frequency,data.frecuency_amount)
      if(data.frequency == 0 && data.frecuency_amount > 0){
        data.endDate = DateTime.fromISO(data.start).plus({days:data.frecuency_amount}).toISO({ includeOffset: false });
        //data = data;
        return;

      }
      if(data.frequency == 1 && data.frecuency_amount > 0){
        data.endDate = DateTime.fromISO(data.start).plus({hours: data.period* data.frecuency_amount}).toISO({ includeOffset: false });
        //data = data;
        return;

      }

    }
    /* Callback */
    let myCallback = (event) => {
      let date = event.detail
      // ...
    }
  </script>


<hr />
<div class="form-group row">
  <label for="endDate" class="col-md-4 col-form-label">
    Cada cuando se toma: 
  </label> 
  
  <div class="col-md-4"> 
    <ListSelect options={["Una vez", "Cada X Horas","Cada X Días","Un día especifico","Desayuno, comida y cena"]} bind:value={data.ftype} inlist={false}  /> 
    
  </div>
  
  
    {#if data.ftype == 1}
    <div class="col-md-4"> 
    <input class="form-control desc" type="number" id="Frecuency" bind:value={data.phours}/> horas
    </div>
    {:else if data.ftype == 2} 
    <div class="col-md-4"> 
    <input class="form-control desc" type="number" id="Frecuency" bind:value={data.pday}/> días
    </div>
    {:else if data.ftype == 3}
    <div class="col-md-4"></div>
    <div class="col-md-4"></div>
    <div class="col-md-8"> 
      {#each ["L","M","M","J","V","S","D"] as day,dIdx}
        <button type="button" class="btn mr-1 {data.pdays == dIdx+1 ? 'btn-primary ':'btn-light '}" on:click={()=>{data.pdays = dIdx + 1;}}>{day}</button>
      {/each}
    </div>
  {/if} 
</div> 
<div class="form-group row">
  <label for="endDate" class="col-md-4 col-form-label">
    Primera dosis:
  </label> 
  <div class="col-md-8"> <input class="form-control" type="datetime-local" id="start" name="start" bind:value={data.start}/>
  </div> 
</div>
<hr />
{#if data.endDate != '' && data.endDate != undefined}
    <div class="form-group row"><label for="observations" class="col-md-4 col-form-label">Última dosis</label><div class="col-md-8 input-group">{DateTime.fromISO(data.endDate).toLocaleString({ month: 'long', day: 'numeric', hour: 'numeric',
      minute: '2-digit', })} </div> </div>
{/if}