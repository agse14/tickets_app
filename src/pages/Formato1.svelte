<script>
    import TitleBar from "../TitleBar.svelte";
    import { pop } from "svelte-spa-router";
  
    export let params = {};
    export let values = {};
    export let onBack = ()=> {
      pop();
    }
  
    let loading;
    let tempId = params.bid;
    let name;
  
    console.log(tempId);
    
    if (!tempId) {
      console.log("Error! No hay un paciente seleccionado");
    }else{
      console.log("Consulta Firebase")
      db.collection("patients")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No hay info
          } else {
            values = query.data();
            name = values.name;
            console.log(query.data());
          }
        });
    }
    
    function cancel() {
      onBack();
    }

</script>
<div class="page-content modal-body">
    <TitleBar title="Formato de Impresión" base="Inventario" />
    <form id="form">
        <div class="row">
            <div class="card">
                <div class="card-body">
                    <button on:click={() => window.print() } class="btn btn-print waves-effect waves-light no-print"><i class="bx bx-printer font-size-16 align-middle mr-2"></i>Imprimir</button>
                    <button type="button" on:click={cancel} class="btn btn-light waves-effect waves-light no-print" disabled={loading}>Cancelar</button>
                    <div style="tab-interval:35.4pt align=center">
                        <div class="card-body">
                            <div class="card-body1">
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; text-align:right; line-height:108%; font-size:11pt">
                                    <span>Fecha: _________________________</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; text-align:center; line-height:108%; font-size:12pt">
                                    <span style="font-weight:bold; font-size:20pt">Carta Consentimiento de Sujeción</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; text-align:justify; line-height:108%; font-size:13pt">
                                    <span>Yo_______________________________________________________Parentesco_____________________________ responsable o representante de la huésped <strong><u>{name}</u></strong> residente de </span>
                                    <span>Desarrollo Médico Integral Del Adulto Mayor S.A. de C.V. (Los olivos estancia sucursal _____________).</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt; text-align:justify;">
                                    <span>Certifico que he sido informada con claridad, que en caso de ser necesario o se estime conveniente se utilizara SUJECIÓN</span>
                                    <span>para cuidar de forma integral el bienestar del residente, bajar el riesgo de caída y en caso de crisis que se lastime o agreda a alguien.</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt; text-align:justify;">
                                    <span>Informando al familiar responsable y al médico tratante </span>
                                    <span>la situación y darle el seguimiento e indicaciones que se indiquen.</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>Comentarios u observaciones:</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; text-align:justify; line-height:108%; font-size:13pt">
                                    <span>________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <div class="form-group row">
                                    <div class="col-md-1 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center; font-size:13pt">
                                        <strong><u>{name}</u></strong>
                                    </div>
                                    <div class="col-md-1 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center">
                                        ______________________________________
                                    </div> 
                                </div>
                                <div class="form-group row">
                                    <div class="col-md-1 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center; font-size:13pt">
                                        Nombre del residente
                                    </div>
                                    <div class="col-md-1 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center; font-size:13pt">
                                        Nombre y firma familiar responsable
                                    </div> 
                                  </div>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <p style="margin-top:0pt; margin-bottom:8pt; line-height:108%; font-size:13pt">
                                    <span>&nbsp;</span>
                                </p>
                                <div class="form-group row">
                                    <div class="col-md-4 col-form-label">
                                    </div>
                                    
                                    <div class="col-md-4 col-form-label">
                                        ______________________________________
                                    </div>
                                    <div class="col-md-3 col-form-label" style="text-align:center">

                                    </div> 
                                </div>
                                <div class="form-group row">
                                    <div class="col-md-3 col-form-label">
                                    </div>
                                    
                                    <div class="col-md-5 col-form-label" style="text-align:center; font-size:13pt">
                                        Representante Los Olivos Estancias
                                    </div>
                                    <div class="col-md-3 col-form-label" style="text-align:center">

                                    </div> 
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
<style type="text/css" media="print">
    /* Aquí irían tus reglas CSS específicas para imprimir */
    .card-body1{
        padding: 1em;
    }
</style>