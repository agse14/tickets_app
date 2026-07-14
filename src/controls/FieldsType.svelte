<script>
    export let value = "";
</script>

<select class="custom-select" bind:value={value}>
    <option value="str">Texto</option>
    <option value="int">Numero</option>
    <option value="float">Decilmales</option>
    <option value="list">Lista</option>
    <option value="ref">Referencia</option>
    <option value="dict">Mapa de valores</option>
    <option value="date">Fecha</option>
    <option value="datetime">Fecha y hora</option>
    <option value="bool">SI o NO</option>
    <option value="file">Archivo</option>
    <option value="buttons">Botones</option>
    <option value="layout">Acomodo</option>
</select>