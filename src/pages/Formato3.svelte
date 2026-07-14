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

                                <p class="MsoNormal" align="center" style="text-align:center"><b style="mso-bidi-font-weight:
                                    normal"><span lang="ES-MX" style="font-size:14.0pt;">PROCURADURIA DE LA DEFENSA DEL ADULTO MAYOR<o:p></o:p></span></b>
                                </p> 
                                <p class="MsoNormal" align="center" style="text-align:center"><b style="mso-bidi-font-weight:
                                    normal"><span lang="ES-MX" style="font-size:12.0pt;">UNIDAD DE ATENCIÓN Y PROFESIONALIZACIÓN PARA ASILOS<o:p></o:p></span></b>
                                </p>
                                <p class="MsoNormal" align="center" style="text-align:center"><b style="mso-bidi-font-weight:
                                    normal"><span lang="ES-MX" style="font-size:12.0pt;">Y CASAS DE CUIDADO DE DIA<o:p></o:p></span></b>
                                </p>  
                                
                                <p class="MsoNormal" align="center" style="text-align:center"><b style="mso-bidi-font-weight:
                                    normal"><span lang="ES-MX" style="font-size:12.0pt;">REGISTRO DE EGRESO DEL ADULTO MAYOR<o:p></o:p></span></b>
                                </p>
                                    
                                <p class="MsoNormal" align="center" style="text-align:center">
                                    <br>
                                    
                                </p>

                                <p class="MsoNormal" style="text-align:right">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Fecha de Elaboración:______________________________<o:p></o:p>
                                    </span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Institución Asistencial:__________________________________________________________________________________________<o:p></o:p>
                                    </span>
                                </p>

                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Directora de la Institución:__________________________________________________________________________________________<o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:center">
                                    <span lang="ES-MX" style="font-size:12.0pt;">DATOS DEL ADULTO MAYOR<o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Nombre:<strong><u>{name}</u></strong>  Edad:_______________<o:p></o:p>
                                    </span>
                                </p>
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Lugar y Fecha de Nacimiento:__________________________________________________________________________  Sexo:_______________<o:p></o:p>
                                    </span>
                                </p>

                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Estado Civil:______________________________________________  Número de hijos:_______________________________________________<o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:center">
                                    <span lang="ES-MX" style="font-size:12.0pt;">DATOS DEL INGRESO<o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Fecha de Ingreso:  Día:______ Mes:______ Año:______ <o:p></o:p>
                                    </span>
                                </p>
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Ingreso realizado por:__________________  PDAM:__________________ Voluntario:____________ <o:p></o:p>
                                    </span>
                                </p>
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Nombre de la persona que lo ingresó:_________________________________________________________________ <o:p></o:p>
                                    </span>
                                </p>
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Parentesco:__________________  Domicilio:_________________________________________________________________ <o:p></o:p>
                                    </span>
                                </p>
                                <p class="MsoNormal" style="text-align:justify; line-height:10%">
                                    <span lang="ES-MX" style="font-size:12.0pt;">Municipio:________________________  Estado:________________________ Teléfono:__________________ <o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:center">
                                    <span lang="ES-MX" style="font-size:12.0pt;">MOTIVO DE INGRESO<o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:justify">
                                    <span lang="ES-MX" style="font-size:12.0pt;">__________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________ <o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:center">
                                    <span lang="ES-MX" style="font-size:12.0pt;">MOTIVO DE EGRESO (breve descripción)<o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <p class="MsoNormal" style="text-align:justify">
                                    <span lang="ES-MX" style="font-size:12.0pt;">____________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________ <o:p></o:p>
                                    </span>
                                </p>
                                <br>
                                <br>
                                <br>
                                <br>
                                <br>
                                <br>
                                <div class="form-group row">
                                    <div class="col-md-1 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center">
                                    </div>
                                    <div class="col-md-3 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center">
                                        ______________________________________
                                    </div> 
                                </div>
                                <div class="form-group row">
                                    <div class="col-md-1 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center">
                                    </div>
                                    <div class="col-md-3 col-form-label">
                                    </div>
                                    <div class="col-md-4 col-form-label" style="text-align:center;font-size:12.0pt">
                                        Nombre y firma del Director
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