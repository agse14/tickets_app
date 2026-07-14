<script>
    export let value = "";
    export let filter = "";
    let subclaves = {};
    let arbol = {
    str: {
          localselect: "Selección local",
          email: "Correo electrónico",
          link: "Link",
          area: "Area de texto",
          }, 
    int: {number: "Number", 
          money: "Money",
          calc: "Calc",
          percentage: "Percentage",
          param: "Parametros",
           },
    float: {money:"Money"},
    list: {select:"Selector",
            table: "Tabla",
            radio: "Radio",
            check: "Checkbox"
          },
    ref: {ref: "Referencia", param:"Parametro del Url"},
    dict: {check: "Casilla",
            custom: "Custom"},
    date: {date: "Fecha",
           ago: "Hace cuanto"},
    datetime: {date: "Fecha y hora",
           ago: "Hace cuanto"},
    bool: {
            async: "Async"},
    file: {picture: "Imagen",
          video: "video",
          audio: "audio"},
    buttons: {action:"Accion",
              save: "Guardar",
              },
    layout: {card:"Card",
            start:"Inicial",
            head: "Head",
            foot: "Foot",
           tab: "Tab",
           tabs: "Tabs"
          },
    
  };
  

  $: filter, asignarSubs();

function asignarSubs(){
  if(arbol[filter] !== undefined){
    subclaves = arbol[filter];
  }else{
    subclaves = {};
  }
}
</script>

<select class="custom-select" bind:value={value}>
    <option value="default">Predeterminado</option>
    {#each Object.entries(subclaves) as [sk,sv]}
      <option value={sk}>{sv}</option>
     
    {/each}
</select>