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
          <button type="button"
          on:click={cancel}
          class="btn btn-light waves-effect waves-light no-print"
          disabled={loading}>
          Cancelar</button>
          <div style="tab-interval:35.4pt align=center">
            <div class="card-body">

            <p align="center" style="text-align:center"><b style="mso-bidi-font-weight:
            normal"><span style="mso-fareast-language:ES;mso-no-proof:yes"><o:p>&nbsp;</o:p></span></b></p>

            <p align="center" style="text-align:center;line-height:115%"><b style="mso-bidi-font-weight:normal"><span>Carta de consentimiento
            informado para el traslado de pacientes en ambulancia<o:p></o:p></span></b></p>

            <p style="line-height:115%"><span>Razón social / Demonización
            del establecimiento: _____________________________________________________</span></p>

            <p style="line-height:115%"><span>Nombre paciente: <strong><u>{name}</u></strong></span></p>

            <p style="line-height:115%"><span>Lugar y fecha: _________________________________________________________</span></p>

            <p style="line-height:115%"><span>Yo
            __________________________________________________________________</span><span> Expreso mi libre
            voluntad para autorizar el traslado en ambulancia señalado en este documento
            después de haberme proporcionado la información completa sobre mi enfermedad y
            estado actual, la cual fue realizada en forma amplia, precisa y suficiente en un lenguaje claro y
            sencillo, informándome sobre los beneficios, posibles riesgos, complicaciones y
            secuelas.</span></p>

            <p style="text-align:justify"><span>De igual forma el
            médico me informó sobre, el derecho a cambiar mi decisión en cualquier momento
            y manifestaría ante el traslado. Así mismo con el propósito de que mi atención
            sea adecuada, me comprometo a proporcionar información completa y veraz así
            como seguir las indicaciones médicas.</span></p>

            <p><span>Otorgo mi autoridad al personal de salud para
            la atención de contingencias y urgencias derivadas del traslado en ambulancia, atendiendo al
            principio de libertad prescriptiva.</span></p>

            <p><span>Unidad médica que refiere o lugar de origen:_______________________________________</span></p>

            <p style="text-align: left;"><span>Unidad médica o lugar al que se traslada: ___________________________________________</span></p>

            <p><span>Diagnóstico de referencia: ________________________________________________________</span></p>

            <p><span>Riesgo: _______________________________________________________________________</span></p>

            <p><span><o:p>&nbsp;</o:p></span></p>

            <p><span><o:p>&nbsp;</o:p></span></p>
            
            <div class="form-group row">
              <div class="col-md-1 col-form-label">
              </div>
              <div class="col-md-4 col-form-label" style="text-align:center">
                ______________________________________
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
              <div class="col-md-4 col-form-label" style="text-align:center">
                Nombre completo y firma del paciente, Familiar o representante legal
              </div>
              <div class="col-md-1 col-form-label">
              </div>
              <div class="col-md-4 col-form-label" style="text-align:center">
                Nombre completo, matrícula y firma del médico tratante
              </div> 
            </div>

            <p><span><o:p>&nbsp;</o:p></span></p>

            <p><span><o:p>&nbsp;</o:p></span></p>

            <p><span><o:p>&nbsp;</o:p></span></p>
            <div class="form-group row">
              <div class="col-md-1 col-form-label">
              </div>
              <div class="col-md-4 col-form-label" style="text-align:center">
                ______________________________________
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
              <div class="col-md-4 col-form-label" style="text-align:center">
                Nombre completo y firma del testigo 1
              </div>
              <div class="col-md-1 col-form-label">
              </div>
              <div class="col-md-4 col-form-label" style="text-align:center">
                Nombre completo y firma del testigo 2
              </div> 
            </div>

            <p></p>

            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>
<style type="text/css" media="print">
  /* Aquí irían tus reglas CSS específicas para imprimir */
  .card-body{
      padding: 1em;
  }
</style>