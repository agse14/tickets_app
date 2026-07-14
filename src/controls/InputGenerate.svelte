<script>


    export let value;

    function generate(){
        if(value == undefined || value == ""){
            var length = 8,
            charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                retVal = "";
            for (var i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            //return retVal;
            value = retVal;
        }
    }
</script>
<button on:click={generate} class="btn btn-primary waves-effect waves-light">Generar</button>