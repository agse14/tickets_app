<script>
    import { link } from "svelte-spa-router";
    export let data = {};

    $: patientId = data.id;
</script>
{#if patientId != undefined}
    <div class="col ">
        <div class="card">
            <div class="card-body">
                <h3>Formatos de paciente</h3>

                <div class="form-group row">
                    <ol>
                        <li for="additional_comments">
                            <a href="/editpatients/{patientId}/Formato" use:link
                                >Carta Consentimiento Traslado en Ambulancia</a
                            >
                        </li>
                        <li for="additional_comments">
                            <a
                                href="/editpatients/{patientId}/Formato1"
                                use:link>Carta Consentimiento SujeciÃ³n</a
                            >
                        </li>
                        <li for="additional_comments">
                            <a
                                href="/editpatients/{patientId}/Formato2"
                                use:link>Contrato de AdmisiÃ³n e Ingreso</a
                            >
                        </li>
                        <li for="additional_comments">
                            <a
                                href="/editpatients/{patientId}/Formato3"
                                use:link
                                >Registro de Egreso del Adulto Mayor (DIF)</a
                            >
                        </li>
                        <li for="additional_comments">
                            <a
                                href="/assets/images/LISTA_DE_ARTICULOS_PARA_INGRESO.pdf"
                                download>Lista de Articulos para Ingreso</a
                            >
                        </li>
                    </ol>
                    <div class="col-md-8 input-group" />
                </div>
            </div>
        </div>
    </div>

    <div class="col ">
        <div class="card">
            <div class="card-body">
                <h3>Formatos de paciente</h3>

                <div class="form-group row">
                    <ol>
                        <li for="additional_comments">
                            <a href="/card/{patientId}" use:link
                                >Tarjeta de Actividades</a
                            >
                        </li>
                    </ol>
                    <div class="col-md-8 input-group" />
                </div>
            </div>
        </div>
    </div>
{/if}
