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
                                    normal"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%;font-family:
                                    &quot;Cambria&quot;,serif;mso-ascii-theme-font:major-latin;mso-hansi-theme-font:major-latin">CONTRATO
                                    DE ADMISIÓN E INGRESO<o:p></o:p></span></b>
                                </p>
                                    
                                <p class="MsoNormal" align="center" style="text-align:center"><b style="mso-bidi-font-weight:
                                    normal"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%;font-family:
                                    &quot;Cambria&quot;,serif;mso-ascii-theme-font:major-latin;mso-hansi-theme-font:major-latin">INFORMACION
                                    Y ACEPTACION DE DERECHOS Y RESPONSABILIDADES<o:p></o:p></span></b>
                                </p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">REUNIDOS<o:p></o:p></span></p>
                                    
                                 <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Por una Parte,
                                    ______________________________________________________, mayor de edad; en nombre y representación de DESARROLLO
                                    MEDICO INTEGRAL DEL ADULTO MAYOR S.A. DE C.V. Nombre comercial LOS OLIVOS
                                    ESTANCIAS (Sucursal _____________) en adelante LOS OLIVOS ESTANCIAS. Por otra, el
                                    (la) Sr(a) <strong><u>{name}</u></strong>, con Documento comprobante de
                                    domicilio e Identificación Oficial adjunto (en adelante el Residente) Y de
                                    otra: El(la) Sr(a) ____________________________________________, <span style="mso-spacerun:yes">&nbsp;</span>con parentesco de ____________; en
                                    representación del Residente y su familia.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">La última parte actúa conjuntamente
                                    con el Residente como RESPONSABLE/S SOLIDARIO/S del mismo en relación con las
                                    obligaciones que en este contrato se asumen.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Las partes intervinientes se
                                    reconocen mutuamente la capacidad legal necesaria para la formalización del presente
                                    contrato y a tal efecto<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">EXPONEN<o:p></o:p></span></p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">I.- Que LOS OLIVOS ESTANCIAS, es un establecimiento
                                    destinado al alojamiento y atención de aquellas personas mayores que, por sus circunstancias
                                    familiares, de salud y/o sociales, precisan la asistencia continuada en la
                                    realización de las actividades de la vida diaria, así como a aquellas otras
                                    que, por su propia voluntad, deciden establecer su residencia en estancia,
                                    configurándose de esta manera como una Residencia para la atención del Adulto
                                    Mayor. <o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">II.- Que LOS OLIVOS ESTANCIAS cuenta
                                    con la Autorización Administrativa de Funcionamiento y permisos correspondientes.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">III.- Que, tanto el Residente como
                                    sus Responsables Solidarios, conocen las instalaciones de <a name="OLE_LINK1"><span style="mso-bookmark:OLE_LINK2"><span style="mso-bookmark:OLE_LINK3">LOS OLIVOS ESTANCIAS</span></span></a> así como
                                    las condiciones de alojamiento, sociales, sanitarias y económicas,
                                    considerándolas de su completa satisfacción, y estando interesados todos ellos
                                    en que el Residente ingrese en LOS OLIVOS ESTANCIAS.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">IV. En el supuesto caso de que el
                                    huésped representado, debido a la edad o enfermedad, requiera atención
                                    especializada, será reubicado dentro de la estancia,<span style="mso-spacerun:yes">&nbsp; </span>a un área donde este mejor vigilado y
                                    atendido.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">V.<span style="mso-spacerun:yes">&nbsp;
                                    </span>En caso de que el huésped debido a la edad o enfermedad, tenga algún
                                    comportamiento, crisis, que pueda poner en riesgo su integridad y la de los
                                    demás, se utilizara la sujeción, y será informado de inmediato al familiar
                                    responsable.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%"><span style="mso-spacerun:yes">&nbsp;</span>VI.- Que el ingreso del Residente en LOS
                                    OLIVOS ESTANCIAS se efectúa libremente por voluntad del mismo y con su consentimiento
                                    o por voluntad de aquella persona que legalmente tiene atribuida la
                                    responsabilidad sobre la guardia y custodia del Residente en caso de
                                    incapacidad del mismo.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">VII.- Que ambas partes han llegado al
                                    acuerdo de formalizar el presente CONTRATO DE ADMISIÓN E INGRESO que se regirá
                                    con arreglo a las siguientes<o:p></o:p></span>
                                </p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">ESTIPULACIONES<o:p></o:p></span></p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Primera.- El presente contrato
                                    entrará en vigor el día __________________, fecha de ingreso del Residente en <a name="OLE_LINK4"><span style="mso-bookmark:OLE_LINK5"><span style="mso-bookmark:OLE_LINK6"><span style="mso-bookmark:OLE_LINK7"><span style="mso-bookmark:OLE_LINK8"><span style="mso-bookmark:OLE_LINK9"><span style="mso-bookmark:OLE_LINK10"><span style="mso-bookmark:OLE_LINK11"><span style="mso-bookmark:OLE_LINK12">LOS
                                    OLIVOS ESTANCIAS</span></span></span></span></span></span></span></span></a>.<o:p></o:p></span>
                                </p>
                                    
                                <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Segunda.- El Residente ocupará en el
                                    momento de su ingreso en LOS OLIVOS ESTANCIAS una habitación en régimen de
                                    estancia _______________, comprometiéndose al pago de la cantidad de $___________
                                    (____________________________________________________________________pesos
                                    M.N.), Por Mes, en concepto de prestación de servicios básicos (Estancia y
                                    Tratamiento Asistencial) de acuerdo con la comunicación de precios efectuada,
                                    tarifas que las partes firmantes declaran en este acto conocer y aceptar. A
                                    dicha cantidad se le añadirá el importe correspondiente al Impuesto sobre el
                                    Valor Agregado (I.V.A.) vigente en cada momento. Si, durante la estancia del
                                    Residente en LOS OLIVOS ESTANCIAS, se produjera algún cambio en su situación
                                    personal, en sus necesidades asistenciales o en el tipo de habitación que
                                    ocupara, la tarifa a pagar se acomodará a la aplicable a la nueva situación de acuerdo
                                    con los precios vigentes en cada momento. 
                                    <span style="mso-spacerun:yes">&nbsp;</span>Por ningún motivo será reembolsable.<o:p></o:p></span>
                                </p>    
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Tercera.- El ingreso del Residente en
                                    LOS OLIVOS ESTANCIAS se realiza previa emisión de informe favorable por el
                                    Médico de la misma el(a) Dr(a)_______________________________________________que
                                    será determinante, tanto en el momento del ingreso como durante la estancia del
                                    Residente en LOS OLIVOS ESTANCIAS, para establecer las necesidades
                                    asistenciales y, en consecuencia, los servicios necesarios para la correcta
                                    atención del Residente. Así mismo, se exime de toda responsabilidad a LOS
                                    OLIVOS ESTANCIAS por los daños que pueda sufrir el residente debido a la
                                    descompensación de su estado mental y/o físico o fracturas consecuencia del
                                    deterioro por edad avanzada, como también por la pérdida o descompostura de
                                    prótesis, aparatos auditivos, placas dentales, etc.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%;mso-ascii-font-family:Calibri;
                                    mso-fareast-font-family:&quot;Times New Roman&quot;;mso-hansi-font-family:Calibri;
                                    mso-bidi-font-family:Calibri;">Cuarta.- </span><a name="OLE_LINK37"></a><a name="OLE_LINK36"></a><a name="OLE_LINK35"><span style="mso-bookmark:OLE_LINK36"><span style="mso-bookmark:OLE_LINK37"><span lang="ES-MX" style="font-size:12.0pt;
                                    line-height:115%">LOS OLIVOS ESTANCIAS </span></span></span></a><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">no se hace responsable de
                                    dinero u objetos de valor que no sean depositados, bajo inventario, en poder de
                                    la encargada de la estancia. Cualquier mueble que se pretenda ingresar a la
                                    estancia, deberá der aprobado por Dirección General y sujetarse al siguiente
                                    reglamento:<o:p></o:p></span></p>
                                <p>
                                    <li type="disc" style="font-size:12.0pt;line-height:115%;mso-ascii-font-family:Calibri;mso-fareast-font-family:&quot;Times New Roman&quot;;
                                    mso-hansi-font-family:Calibri;mso-bidi-font-family:Calibri;">
                                        No se permite introducir sillones en sala general de otro color que no sea color chocolate    
                                    </li>
                                </p>
                                <p>
                                    <li type="disc" style="font-size:12.0pt;line-height:115%;mso-ascii-font-family:Calibri;mso-fareast-font-family:&quot;Times New Roman&quot;;
                                    mso-hansi-font-family:Calibri;mso-bidi-font-family:Calibri;">
                                        Fotos y cuadros en habitaciones únicamente los que quedan en el recuadro verde dispuesto arriba de la cabecera especial para poner fotos y recuadros
                                    </li>
                                </p>
                                <p>
                                    <li type="disc" style="font-size:12.0pt;line-height:115%;mso-ascii-font-family:Calibri;mso-fareast-font-family:&quot;Times New Roman&quot;;
                                    mso-hansi-font-family:Calibri;mso-bidi-font-family:Calibri;">
                                        En cuarto compartidos prohibido traer frigo-bares, TV, lámparas, o cualquier tipo de muebles que no sean propiedad de los Olivos.
                                    </li>
                                </p>
                                <p>
                                    <li type="disc" style="font-size:12.0pt;line-height:115%;mso-ascii-font-family:Calibri;mso-fareast-font-family:&quot;Times New Roman&quot;;
                                    mso-hansi-font-family:Calibri;mso-bidi-font-family:Calibri;">
                                        Únicamente se aceptan camas eléctricas blancas modernas, previamente se deberá de enviar una foto para ser aceptadas
                                    </li>
                                </p>
                                <p>
                                    <li type="disc" style="font-size:12.0pt;line-height:115%;mso-ascii-font-family:Calibri;mso-fareast-font-family:&quot;Times New Roman&quot;;
                                    mso-hansi-font-family:Calibri;mso-bidi-font-family:Calibri;">
                                        Cualquier donación debe hacer aprobada por la Dirección General antes de ser ingresada a la Estancia.Únicamente se aceptan camas eléctricas blancas modernas, previamente se deberá de enviar una foto para ser aceptadas.
                                    </li>
                                </p> 

                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Quinta.- El Residente pagará a <a name="OLE_LINK25"></a><a name="OLE_LINK24"></a><a name="OLE_LINK23"></a><a name="OLE_LINK22"></a><a name="OLE_LINK21"></a><a name="OLE_LINK20"></a><a name="OLE_LINK19"></a><a name="OLE_LINK18"></a><a name="OLE_LINK17"><span style="mso-bookmark:OLE_LINK18"><span style="mso-bookmark:OLE_LINK19"><span style="mso-bookmark:OLE_LINK20"><span style="mso-bookmark:OLE_LINK21"><span style="mso-bookmark:OLE_LINK22"><span style="mso-bookmark:OLE_LINK23"><span style="mso-bookmark:OLE_LINK24"><span style="mso-bookmark:OLE_LINK25">LOS
                                    OLIVOS ESTANCIAS</span></span></span></span></span></span></span></span></a>,
                                    mensualmente y dentro de los siete días posteriores al vencimiento de su
                                    mensualidad, mediante la forma de pago que más adelante se establece, el importe
                                    correspondiente a los servicios prestados, tanto básicos como complementarios,
                                    todo ello de acuerdo con la tarifa vigente en cada momento y según lo
                                    establecido en la anterior Estipulación Segunda. Dichas tarifas serán
                                    actualizadas anualmente LOS OLIVOS ESTANCIAS, actualización que será comunicada
                                    al Residente y/o Responsables Solidarios y a los organismos administrativos
                                    competentes.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Para el abono de mensualidades
                                    generadas, el Residente señala la siguiente forma de<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><v:roundrect id="_x0035__x0020_Rect�ngulo_x0020_redondeado" o:spid="_x0000_s1028" style="position:absolute;left:0;text-align:left;
                                    margin-left:276.6pt;margin-top:2.35pt;width:17.1pt;height:10.65pt;z-index:251662336;
                                    visibility:visible;mso-wrap-style:square;mso-width-percent:0;
                                    mso-height-percent:0;mso-wrap-distance-left:9pt;mso-wrap-distance-top:0;
                                    mso-wrap-distance-right:9pt;mso-wrap-distance-bottom:0;
                                    mso-position-horizontal:absolute;mso-position-horizontal-relative:text;
                                    mso-position-vertical:absolute;mso-position-vertical-relative:text;
                                    mso-width-percent:0;mso-height-percent:0;mso-width-relative:margin;
                                    mso-height-relative:margin;v-text-anchor:middle" arcsize="10923f" o:gfxdata="UEsDBBQABgAIAAAAIQC2gziS/gAAAOEBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbJSRQU7DMBBF
                                    90jcwfIWJU67QAgl6YK0S0CoHGBkTxKLZGx5TGhvj5O2G0SRWNoz/78nu9wcxkFMGNg6quQqL6RA
                                    0s5Y6ir5vt9lD1JwBDIwOMJKHpHlpr69KfdHjyxSmriSfYz+USnWPY7AufNIadK6MEJMx9ApD/oD
                                    OlTrorhX2lFEilmcO2RdNtjC5xDF9pCuTyYBB5bi6bQ4syoJ3g9WQ0ymaiLzg5KdCXlKLjvcW893
                                    SUOqXwnz5DrgnHtJTxOsQfEKIT7DmDSUCaxw7Rqn8787ZsmRM9e2VmPeBN4uqYvTtW7jvijg9N/y
                                    JsXecLq0q+WD6m8AAAD//wMAUEsDBBQABgAIAAAAIQA4/SH/1gAAAJQBAAALAAAAX3JlbHMvLnJl
                                    bHOkkMFqwzAMhu+DvYPRfXGawxijTi+j0GvpHsDYimMaW0Yy2fr2M4PBMnrbUb/Q94l/f/hMi1qR
                                    JVI2sOt6UJgd+ZiDgffL8ekFlFSbvV0oo4EbChzGx4f9GRdb25HMsYhqlCwG5lrLq9biZkxWOiqY
                                    22YiTra2kYMu1l1tQD30/bPm3wwYN0x18gb45AdQl1tp5j/sFB2T0FQ7R0nTNEV3j6o9feQzro1i
                                    OWA14Fm+Q8a1a8+Bvu/d/dMb2JY5uiPbhG/ktn4cqGU/er3pcvwCAAD//wMAUEsDBBQABgAIAAAA
                                    IQDLCCIYbAIAACYFAAAOAAAAZHJzL2Uyb0RvYy54bWysVN1u0zAUvkfiHSzfszRlZVAtnapNQ0jT
                                    mLahXbuO3UbYPubYbVLehmfhxTh20mwaiEmIG8cn5/873/HpWWcN2ykMDbiKl0cTzpSTUDduXfEv
                                    95dv3nMWonC1MOBUxfcq8LPF61enrZ+rKWzA1AoZBXFh3vqKb2L086IIcqOsCEfglSOlBrQikojr
                                    okbRUnRriulk8q5oAWuPIFUI9PeiV/JFjq+1kvGz1kFFZipOtcV8Yj5X6SwWp2K+RuE3jRzKEP9Q
                                    hRWNo6RjqAsRBdti81so20iEADoeSbAFaN1IlXugbsrJs27uNsKr3AuBE/wIU/h/YeX17gZZU1d8
                                    xpkTlkY0Y7cE288fbr01wFDV4GolakhYtT7MyeXO3+AgBbqmxjuNNn2pJdZlfPcjvqqLTNLPaXlS
                                    ntAUJKnKt7PpbJZiFo/OHkP8qMCydKk4wtbVqZgMrdhdhdjbH+zIOVXU15BvcW9UKsO4W6WpL8pa
                                    Zu/MKHVukO0EcaH+Wg65s2Vy0Y0xo9P0706DbXJTmWWj4wvZRuucEVwcHW3jAF/I2tsfuu57TW3H
                                    btUN81hBvaeJIvRUD15eNgTmlQjxRiBxm/CnfY2f6dAG2orDcONsA/j9T/+TPVGOtJy1tCsVD9+2
                                    AhVn5pMjMn4oj4/TcmXheHYyJQGfalZPNW5rz4FGUNLL4GW+JvtoDleNYB9orZcpK6mEk5S74jLi
                                    QTiP/Q7TwyDVcpnNaKG8iFfuzsvD0BNP7rsHgX5gVCQqXsNhr8T8Gad62zQaB8ttBN1kwiWIe1wH
                                    6GkZM2+HhyNt+1M5Wz0+b4tfAAAA//8DAFBLAwQUAAYACAAAACEAh7x5N90AAAAIAQAADwAAAGRy
                                    cy9kb3ducmV2LnhtbEyPzU/CQBTE7yb+D5tn4k22FMpH6StREz0DKudH99FW9qPpLlD/e9cTHicz
                                    mflNsR6MFhfufesswniUgGBbOdXaGuHz4+1pAcIHsoq0s4zwwx7W5f1dQblyV7vlyy7UIpZYnxNC
                                    E0KXS+mrhg35kevYRu/oekMhyr6WqqdrLDdapkkyk4ZaGxca6vi14eq0OxuEfvv+MjmFr41bLvW4
                                    peP+e6MM4uPD8LwCEXgItzD84Ud0KCPTwZ2t8kIjZNkkjVGE6RxE9LPFfArigJDOEpBlIf8fKH8B
                                    AAD//wMAUEsBAi0AFAAGAAgAAAAhALaDOJL+AAAA4QEAABMAAAAAAAAAAAAAAAAAAAAAAFtDb250
                                    ZW50X1R5cGVzXS54bWxQSwECLQAUAAYACAAAACEAOP0h/9YAAACUAQAACwAAAAAAAAAAAAAAAAAv
                                    AQAAX3JlbHMvLnJlbHNQSwECLQAUAAYACAAAACEAywgiGGwCAAAmBQAADgAAAAAAAAAAAAAAAAAu
                                    AgAAZHJzL2Uyb0RvYy54bWxQSwECLQAUAAYACAAAACEAh7x5N90AAAAIAQAADwAAAAAAAAAAAAAA
                                    AADGBAAAZHJzL2Rvd25yZXYueG1sUEsFBgAAAAAEAAQA8wAAANAFAAAAAA==
                                    " fillcolor="gray [1616]" strokecolor="black [3040]">
                                    <v:fill color2="#d9d9d9 [496]" rotate="t" angle="180" colors="0 #bcbcbc;22938f #d0d0d0;1 #ededed" focus="100%" type="gradient">
                                    <v:shadow on="t" color="black" opacity="24903f" origin=",.5" offset="0,.55556mm">
                                    <v:textbox>
                                    <!--[if !mso]-->
                                    <table cellpadding="0" cellspacing="0" width="100%">
                                    <tbody><tr>
                                        <td><!--[endif]-->
                                        <div>
                                        <p class="MsoNormal" align="center" style="text-align:center"><span style="mso-spacerun:yes">&nbsp;</span></p>
                                        </div>
                                        <!--[if !mso]--></td>
                                    </tr>
                                    </tbody></table>
                                    <!--[endif]--></v:textbox>
                                    </v:shadow></v:fill></v:roundrect><v:roundrect id="_x0032__x0020_Rect�ngulo_x0020_redondeado" o:spid="_x0000_s1027" style="position:absolute;left:0;text-align:left;
                                    margin-left:176.25pt;margin-top:2.5pt;width:17.1pt;height:10.65pt;z-index:251660288;
                                    visibility:visible;mso-wrap-style:square;mso-width-percent:0;
                                    mso-height-percent:0;mso-wrap-distance-left:9pt;mso-wrap-distance-top:0;
                                    mso-wrap-distance-right:9pt;mso-wrap-distance-bottom:0;
                                    mso-position-horizontal:absolute;mso-position-horizontal-relative:text;
                                    mso-position-vertical:absolute;mso-position-vertical-relative:text;
                                    mso-width-percent:0;mso-height-percent:0;mso-width-relative:margin;
                                    mso-height-relative:margin;v-text-anchor:middle" arcsize="10923f" o:gfxdata="UEsDBBQABgAIAAAAIQC2gziS/gAAAOEBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbJSRQU7DMBBF
                                    90jcwfIWJU67QAgl6YK0S0CoHGBkTxKLZGx5TGhvj5O2G0SRWNoz/78nu9wcxkFMGNg6quQqL6RA
                                    0s5Y6ir5vt9lD1JwBDIwOMJKHpHlpr69KfdHjyxSmriSfYz+USnWPY7AufNIadK6MEJMx9ApD/oD
                                    OlTrorhX2lFEilmcO2RdNtjC5xDF9pCuTyYBB5bi6bQ4syoJ3g9WQ0ymaiLzg5KdCXlKLjvcW893
                                    SUOqXwnz5DrgnHtJTxOsQfEKIT7DmDSUCaxw7Rqn8787ZsmRM9e2VmPeBN4uqYvTtW7jvijg9N/y
                                    JsXecLq0q+WD6m8AAAD//wMAUEsDBBQABgAIAAAAIQA4/SH/1gAAAJQBAAALAAAAX3JlbHMvLnJl
                                    bHOkkMFqwzAMhu+DvYPRfXGawxijTi+j0GvpHsDYimMaW0Yy2fr2M4PBMnrbUb/Q94l/f/hMi1qR
                                    JVI2sOt6UJgd+ZiDgffL8ekFlFSbvV0oo4EbChzGx4f9GRdb25HMsYhqlCwG5lrLq9biZkxWOiqY
                                    22YiTra2kYMu1l1tQD30/bPm3wwYN0x18gb45AdQl1tp5j/sFB2T0FQ7R0nTNEV3j6o9feQzro1i
                                    OWA14Fm+Q8a1a8+Bvu/d/dMb2JY5uiPbhG/ktn4cqGU/er3pcvwCAAD//wMAUEsDBBQABgAIAAAA
                                    IQAxklEybgIAAC0FAAAOAAAAZHJzL2Uyb0RvYy54bWysVF9v0zAQf0fiO1h+Z2nCyqBaOlWbhpCm
                                    rdqG9uw6dhvh+MzZbVK+DZ9lX4yzk2bTQExCvNh3vv93v/PpWdcYtlPoa7Alz48mnCkroartuuRf
                                    7y/ffeTMB2ErYcCqku+V52fzt29OWzdTBWzAVAoZObF+1rqSb0JwsyzzcqMa4Y/AKUtCDdiIQCyu
                                    swpFS94bkxWTyYesBawcglTe0+tFL+Tz5F9rJcON1l4FZkpOuYV0YjpX8czmp2K2RuE2tRzSEP+Q
                                    RSNqS0FHVxciCLbF+jdXTS0RPOhwJKHJQOtaqlQDVZNPXlRztxFOpVqoOd6NbfL/z6283i2R1VXJ
                                    C86saGhEBbultj3+tOutAYaqAlspUUHsVev8jEzu3BIHzhMZC+80NvGmkliX+rsf+6u6wCQ9FvlJ
                                    fkJTkCTK30+L6TT6zJ6MHfrwWUHDIlFyhK2tYjKptWJ35UOvf9Aj45hRn0Oiwt6omIaxt0pTXRQ1
                                    T9YJUercINsJwkL1LR9iJ81oomtjRqPi70aDbjRTCWWj4SvRRu0UEWwYDZvaAr4Stdc/VN3XGssO
                                    3apLQ0xFxZcVVHsaLEKPeO/kZU09vRI+LAUSxGkMtLbhhg5toC05DBRnG8Aff3qP+oQ8knLW0sqU
                                    3H/fClScmS+WMPkpPz6OO5aY4+lJQQw+l6yeS+y2OQeaRE4fhJOJjPrBHEiN0DzQdi9iVBIJKyl2
                                    yWXAA3Me+lWm/0GqxSKp0V45Ea7snZOH2Ue43HcPAt0ArECIvIbDeonZC2j1unFCFhbbALpOuHvq
                                    6zAB2skE3+H/iEv/nE9aT7/c/BcAAAD//wMAUEsDBBQABgAIAAAAIQBfNeqM3QAAAAgBAAAPAAAA
                                    ZHJzL2Rvd25yZXYueG1sTI/NTsMwEITvSLyDtUjcqNNECW2IUwESnNvyc97G2yTUXkex24a3xz2V
                                    42hGM99Uq8kacaLR944VzGcJCOLG6Z5bBZ8fbw8LED4gazSOScEveVjVtzcVltqdeUOnbWhFLGFf
                                    ooIuhKGU0jcdWfQzNxBHb+9GiyHKsZV6xHMst0amSVJIiz3HhQ4Heu2oOWyPVsG4eX/JDuFr7ZZL
                                    M+9x//2z1lap+7vp+QlEoClcw3DBj+hQR6adO7L2wijI8jSPUQV5vBT9bFE8gtgpSIsMZF3J/wfq
                                    PwAAAP//AwBQSwECLQAUAAYACAAAACEAtoM4kv4AAADhAQAAEwAAAAAAAAAAAAAAAAAAAAAAW0Nv
                                    bnRlbnRfVHlwZXNdLnhtbFBLAQItABQABgAIAAAAIQA4/SH/1gAAAJQBAAALAAAAAAAAAAAAAAAA
                                    AC8BAABfcmVscy8ucmVsc1BLAQItABQABgAIAAAAIQAxklEybgIAAC0FAAAOAAAAAAAAAAAAAAAA
                                    AC4CAABkcnMvZTJvRG9jLnhtbFBLAQItABQABgAIAAAAIQBfNeqM3QAAAAgBAAAPAAAAAAAAAAAA
                                    AAAAAMgEAABkcnMvZG93bnJldi54bWxQSwUGAAAAAAQABADzAAAA0gUAAAAA
                                    " fillcolor="gray [1616]" strokecolor="black [3040]">
                                    <v:fill color2="#d9d9d9 [496]" rotate="t" angle="180" colors="0 #bcbcbc;22938f #d0d0d0;1 #ededed" focus="100%" type="gradient">
                                    <v:shadow on="t" color="black" opacity="24903f" origin=",.5" offset="0,.55556mm">
                                    <v:textbox>
                                    <!--[if !mso]-->
                                    <table cellpadding="0" cellspacing="0" width="100%">
                                    <tbody><tr>
                                        <td><!--[endif]-->
                                        <div>
                                        <p class="MsoNormal" align="center" style="text-align:center"><span style="mso-spacerun:yes">&nbsp;</span></p>
                                        </div>
                                        <!--[if !mso]--></td>
                                    </tr>
                                    </tbody></table>
                                    <!--[endif]--></v:textbox>
                                    </v:shadow></v:fill></v:roundrect><v:roundrect id="_x0031__x0020_Rect�ngulo_x0020_redondeado" o:spid="_x0000_s1026" style="position:absolute;left:0;text-align:left;
                                    margin-left:50.2pt;margin-top:2.65pt;width:17.1pt;height:10.65pt;z-index:251659264;
                                    visibility:visible;mso-wrap-style:square;mso-wrap-distance-left:9pt;
                                    mso-wrap-distance-top:0;mso-wrap-distance-right:9pt;
                                    mso-wrap-distance-bottom:0;mso-position-horizontal:absolute;
                                    mso-position-horizontal-relative:text;mso-position-vertical:absolute;
                                    mso-position-vertical-relative:text;v-text-anchor:middle" arcsize="10923f" o:gfxdata="UEsDBBQABgAIAAAAIQC2gziS/gAAAOEBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbJSRQU7DMBBF
                                    90jcwfIWJU67QAgl6YK0S0CoHGBkTxKLZGx5TGhvj5O2G0SRWNoz/78nu9wcxkFMGNg6quQqL6RA
                                    0s5Y6ir5vt9lD1JwBDIwOMJKHpHlpr69KfdHjyxSmriSfYz+USnWPY7AufNIadK6MEJMx9ApD/oD
                                    OlTrorhX2lFEilmcO2RdNtjC5xDF9pCuTyYBB5bi6bQ4syoJ3g9WQ0ymaiLzg5KdCXlKLjvcW893
                                    SUOqXwnz5DrgnHtJTxOsQfEKIT7DmDSUCaxw7Rqn8787ZsmRM9e2VmPeBN4uqYvTtW7jvijg9N/y
                                    JsXecLq0q+WD6m8AAAD//wMAUEsDBBQABgAIAAAAIQA4/SH/1gAAAJQBAAALAAAAX3JlbHMvLnJl
                                    bHOkkMFqwzAMhu+DvYPRfXGawxijTi+j0GvpHsDYimMaW0Yy2fr2M4PBMnrbUb/Q94l/f/hMi1qR
                                    JVI2sOt6UJgd+ZiDgffL8ekFlFSbvV0oo4EbChzGx4f9GRdb25HMsYhqlCwG5lrLq9biZkxWOiqY
                                    22YiTra2kYMu1l1tQD30/bPm3wwYN0x18gb45AdQl1tp5j/sFB2T0FQ7R0nTNEV3j6o9feQzro1i
                                    OWA14Fm+Q8a1a8+Bvu/d/dMb2JY5uiPbhG/ktn4cqGU/er3pcvwCAAD//wMAUEsDBBQABgAIAAAA
                                    IQASz2H1bgIAAC0FAAAOAAAAZHJzL2Uyb0RvYy54bWysVNtu1DAQfUfiHyy/02xCl8Kq2WrVqgip
                                    KlVb1GevY+9GOB4z9m6y/A3fwo8xdi6tCqIS4sXxZO5zzvj0rGsM2yv0NdiS50czzpSVUNV2U/Iv
                                    95dv3nPmg7CVMGBVyQ/K87Pl61enrVuoArZgKoWMgli/aF3JtyG4RZZ5uVWN8EfglCWlBmxEIBE3
                                    WYWipeiNyYrZ7F3WAlYOQSrv6e9Fr+TLFF9rJcNnrb0KzJScagvpxHSu45ktT8Vig8JtazmUIf6h
                                    ikbUlpJOoS5EEGyH9W+hmloieNDhSEKTgda1VKkH6iafPevmbiucSr3QcLybxuT/X1h5vb9BVleE
                                    HWdWNARRzm5pbD9/2M3OAENVga2UqCDOqnV+QS537gYHydM1Nt5pbOKXWmJdmu9hmq/qApP0s8hP
                                    8hNCQZIqfzsv5vMYM3t0dujDRwUNi5eSI+xsFYtJoxX7Kx96+9GOnGNFfQ3pFg5GxTKMvVWa+qKs
                                    efJOjFLnBtleEBeqr/mQO1lGF10bMzkVf3cabKObSiybHF/INlmnjGDD5NjUFvCFrL392HXfa2w7
                                    dOsugViMIK2hOhCwCD3jvZOXNc30SvhwI5AoTjDQ2obPdGgDbclhuHG2Bfz+p//RnphHWs5aWpmS
                                    +287gYoz88kSJz/kx8dxx5JwPD8pSMCnmvVTjd0150BIEO+ounSN9sGMV43QPNB2r2JWUgkrKXfJ
                                    ZcBROA/9KtP7INVqlcxor5wIV/bOyRH7SJf77kGgG4gViJHXMK6XWDyjVm8bEbKw2gXQdeJdnHQ/
                                    1wEB2slE3+H9iEv/VE5Wj6/c8hcAAAD//wMAUEsDBBQABgAIAAAAIQAYeP9k2wAAAAgBAAAPAAAA
                                    ZHJzL2Rvd25yZXYueG1sTI/NbsIwEITvlfoO1lbqrdgQiEoaB7WV2jPQn/MSL0mKvY5iA+nb15zo
                                    cTSjmW/K1eisONEQOs8aphMFgrj2puNGw+fH28MjiBCRDVrPpOGXAqyq25sSC+PPvKHTNjYilXAo
                                    UEMbY19IGeqWHIaJ74mTt/eDw5jk0Egz4DmVOytnSuXSYcdpocWeXluqD9uj0zBs3l+yQ/xa++XS
                                    Tjvcf/+sjdP6/m58fgIRaYzXMFzwEzpUiWnnj2yCsEkrNU9RDYsMxMXP5jmInYZZnoOsSvn/QPUH
                                    AAD//wMAUEsBAi0AFAAGAAgAAAAhALaDOJL+AAAA4QEAABMAAAAAAAAAAAAAAAAAAAAAAFtDb250
                                    ZW50X1R5cGVzXS54bWxQSwECLQAUAAYACAAAACEAOP0h/9YAAACUAQAACwAAAAAAAAAAAAAAAAAv
                                    AQAAX3JlbHMvLnJlbHNQSwECLQAUAAYACAAAACEAEs9h9W4CAAAtBQAADgAAAAAAAAAAAAAAAAAu
                                    AgAAZHJzL2Uyb0RvYy54bWxQSwECLQAUAAYACAAAACEAGHj/ZNsAAAAIAQAADwAAAAAAAAAAAAAA
                                    AADIBAAAZHJzL2Rvd25yZXYueG1sUEsFBgAAAAAEAAQA8wAAANAFAAAAAA==
                                    " fillcolor="gray [1616]" strokecolor="black [3040]">
                                    <v:fill color2="#d9d9d9 [496]" rotate="t" angle="180" colors="0 #bcbcbc;22938f #d0d0d0;1 #ededed" focus="100%" type="gradient">
                                    <v:shadow on="t" color="black" opacity="24903f" origin=",.5" offset="0,.55556mm">
                                    <v:textbox>
                                    <!--[if !mso]-->
                                    <table cellpadding="0" cellspacing="0" width="100%">
                                    <tbody><tr>
                                        <td><!--[endif]-->
                                        <div>
                                        <p class="MsoNormal" align="center" style="text-align:center"><span style="mso-spacerun:yes">&nbsp;</span></p>
                                        </div>
                                        <!--[if !mso]--></td>
                                    </tr>
                                    </tbody></table>
                                    <!--[endif]--></v:textbox>
                                    </v:shadow></v:fill></v:roundrect><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">pago<a name="OLE_LINK41"></a><a name="OLE_LINK40"></a><a name="OLE_LINK39"></a><a name="OLE_LINK38"><span style="mso-bookmark:OLE_LINK39"><span style="mso-bookmark:
                                    OLE_LINK40"><span style="mso-bookmark:OLE_LINK41">:<span style="mso-spacerun:yes">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span></span></a><a name="OLE_LINK16"></a><a name="OLE_LINK15"></a><a name="OLE_LINK14"></a><a name="OLE_LINK13"><span style="mso-bookmark:OLE_LINK14"><span style="mso-bookmark:
                                    OLE_LINK15"><span style="mso-bookmark:OLE_LINK16"><span style="mso-bookmark:
                                    OLE_LINK41"><span style="mso-bookmark:OLE_LINK40"><span style="mso-bookmark:
                                    OLE_LINK39"><span style="mso-bookmark:OLE_LINK38">Por</span></span></span></span></span></span></span></a><span style="mso-bookmark:OLE_LINK41"><span style="mso-bookmark:OLE_LINK40"><span style="mso-bookmark:OLE_LINK39"><span style="mso-bookmark:OLE_LINK38"><span style="mso-spacerun:yes">&nbsp;&nbsp; </span>Efectivo </span></span></span></span><span style="mso-spacerun:yes">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span style="mso-spacerun:yes">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>Por<span style="mso-spacerun:yes">&nbsp;&nbsp; </span>Cheque<span style="mso-spacerun:yes">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span><span style="mso-spacerun:yes">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span style="mso-spacerun:yes">&nbsp;&nbsp;</span>Por <span style="mso-spacerun:yes">&nbsp;</span>Banco<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Datos bancarios: Banco____________________________
                                    Núm. De Cuenta___________________________<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Titulares: _________________________________________________<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Sexta.- Del incumplimiento al punto
                                    anterior, se estipula un interés moratorio del 5% mensual sobre saldos
                                    insolutos, cobrable al momento de la liquidación de la mensualidad; como penalización
                                    por pagar después de 7 días después del plazo establecido.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Séptima. - En caso de que el
                                    residente decida retirarse de la estancia, la mensualidad se reembolsara al 100
                                    % únicamente en el caso de que sean dentro de los primeros 5 días hábiles
                                    después del ingreso, de lo contrario el monto de la mensualidad no será
                                    rembolsable.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Octava. - <span style="mso-spacerun:yes">&nbsp;</span>Durante su estancia en LOS OLIVOS ESTANCIAS el
                                    Residente recibirá la prestación de los SERVICIOS BÁSICOS (Estancia y
                                    Tratamiento Asistencial) con el siguiente contenido:<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">1. Alojamiento: el uso de la
                                    habitación en el régimen (individual, doble, compartido, etc.) contratado, así
                                    como la utilización y disfrute de las zonas de estancia común de LOS OLIVOS
                                    ESTANCIAS. La habitación se encontrará convenientemente amueblada y equipada,
                                    permitiéndose al Residente disponer de motivos de decoración y utensilios
                                    propios siempre que no sean inadecuados o peligrosos. La habitación se
                                    encontrará dotada con la correspondiente ropa de cama y bańo que será cambiada
                                    con la frecuencia necesaria y en todo caso semanalmente.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">2. Alimentación: la prestación de
                                    este servicio se ajustará a las reglas establecidas en el<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Reglamento de Régimen Interior entre
                                    las que se destacan las siguientes:<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">a. La alimentación se prestará en
                                    régimen de estancia completa.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">b. Todas las comidas se servirán en
                                    el comedor general del Centro, salvo que, por prescripción facultativa, deba
                                    prestarse este servicio en la habitación del Residente o en la zona de cuidados
                                    especiales.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">c. Los menús se someterán a la
                                    aprobación de la Dirección de los Servicios Médicos de LOS OLIVOS ESTANCIAS,
                                    garantizándose el aporte calórico y dietético adecuado. Se atenderá a que los menús
                                    sean variados cuidando su presentación para que resulten atractivos y
                                    apetitosos.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Junto con el menú ordinario se
                                    prepararán otros destinados a aquellos usuarios que precisen un régimen
                                    especial.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">d. Los Residentes se ajustarán al
                                    menú general de LOS OLIVOS ESTANCIAS, salvo que por prescripción facultativa
                                    precisaran un régimen especial. Fuera de los regímenes alimenticios que en cada
                                    caso correspondan no se servirán extras de ninguna clase.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">e. Se prestará la ayuda necesaria a
                                    los Residentes que no puedan comer por sí mismos, utilizando en su caso los
                                    medios técnicos precisos.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">3. Lavandería: que comprenderá el
                                    lavado y planchado de la ropa de uso personal del Residente, ajustándose en
                                    todo caso a la tipología de las prendas para garantizar su higiene y conservación
                                    en buen estado. No se incluye en ningún caso el lavado en seco ni tintorería.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">a. El Residente aportará la ropa y
                                    calzado de uso personal y la repondrá a su cargo.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">b. Los Residentes vestirán
                                    habitualmente ropa de calle adaptada a las condiciones de la estación en que se
                                    use.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">4. Cuidado Personal: garantizándose
                                    el aseo personal diario de los Residentes con prestación de apoyo en el grado
                                    en que sea necesario en cada caso. Los útiles de aseo de uso personal deberán ser
                                    aportados por el Residente. Este servicio se prestará en las condiciones y
                                    horarios fijados en el Reglamento de régimen Interior del Centro.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">5. Control y Protección: Los
                                    Residentes tendrán derecho al uso de los servicios comunes existentes en LOS
                                    OLIVOS ESTANCIAS, de libre utilización y únicamente sujetos a las normas que
                                    puedan establecerse para un mejor aprovechamiento de los mismos. Los Residentes
                                    gozarán de libertad de movimientos en las áreas de uso común de LOS OLIVOS
                                    ESTANCIAS.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">6. atención Médico-Geriátrica,
                                    Rehabilitadora y Social: al ingreso del Residente se llevará a cabo su estudio
                                    y evaluación interdisciplinares, a partir de los cuales se elaborará un
                                    Programa de atención Personalizada que comprenderá todas aquellas actuaciones
                                    dirigidas a alcanzar y mantener en el mayor grado posible su salud, autonomía
                                    personal e integración social.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">a. De cada Residente existirá un
                                    expediente personal en el que constará la información personal, social y
                                    médica, así como la que pueda derivarse del programa a que está sujeto el Residente,
                                    los informes técnicos correspondientes, diagnósticos, tratamientos prescritos y
                                    el seguimiento y evaluación del programa que se haya fijado así como las
                                    incidencias producidas en su desarrollo. El tratamiento de los datos recogidos
                                    en dichos expedientes quedará sometido a las reglas deontológicas del secreto profesional.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Novena.- El familar del Residente dará
                                    las instrucciones precisas a LOS OLIVOS ESTANCIAS para que, en caso de que el
                                    estado de salud del Residente así lo requiera, y según su Cuadro Médico el
                                    Residente sea trasladado <span style="mso-spacerun:yes">&nbsp;</span>al Centro
                                    Médico o a la Institución que el familiar del Residente indique para su atención
                                    o cuidado, comprometiéndose expresamente el Residente a asumir todos los gastos
                                    que pudieran derivarse de tal traslado y/o de la estancia en el Centro o
                                    Institución aludida. Igualmente el/la residente y las personas o familiares
                                    responsables firmantes del presente contrato, delegan de forma expresa en LOS
                                    OLIVOS ESTANCIAS, la realización de todas las gestiones precisas para adquirir
                                    los medicamentos, <a name="OLE_LINK29"></a><a name="OLE_LINK28"></a><a name="OLE_LINK27"></a><a name="OLE_LINK26"><span style="mso-bookmark:OLE_LINK27"><span style="mso-bookmark:OLE_LINK28"><span style="mso-bookmark:OLE_LINK29">estudios
                                    de laboratorio y pañales </span></span></span></a>que precise el /la residente
                                    según pauta médica, siendo responsabilidad de <a name="OLE_LINK34"></a><a name="OLE_LINK33"></a><a name="OLE_LINK32"></a><a name="OLE_LINK31"></a><a name="OLE_LINK30"><span style="mso-bookmark:OLE_LINK31"><span style="mso-bookmark:
                                    OLE_LINK32"><span style="mso-bookmark:OLE_LINK33"><span style="mso-bookmark:
                                    OLE_LINK34">LOS OLIVOS ESTANCIAS</span></span></span></span></a>, decidir a través
                                    de qué farmacia se obtienen dichos medicamentos, estudios de laboratorio y
                                    pañales.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Decima. - En uso del principio de la
                                    autonomía de la voluntad de las partes, los firmantes del presente contrato
                                    acuerdan voluntariamente que el mismo podrá ser resuelto por cualquiera de
                                    ellos preavisando a la otra parte con una antelación mínima de quince días a la
                                    fecha en que tal resolución deba surtir efecto.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Décimo primero. - El(a) Sr(a)
                                    ______________________________________________________________ domiciliado en
                                    C/ _______________________, _______________________ , teléfonos, ______________ y ______________, en
                                    calidad de Familiar/Representante Solidario del Residente actuará como
                                    Responsable de éste a todos los efectos y muy especialmente en la
                                    comunicaciones y notificaciones de la Residencia en relación a las condiciones económicas
                                    o de funcionamiento. De igual forma se compromete a poner en conocimiento de
                                    LOS OLIVOS ESTANCIAS cualquier variación sobre los datos aportados a la misma
                                    en este u otros documentos como son: domicilios, teléfonos de contacto,
                                    relación de familiares, etc.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">En relación con cualquier tipo de
                                    incidente, comunicación o cuestiones referentes a la salud del Residente, la
                                    Residencia solo estará obligada a ponerlo en conocimiento del Responsable
                                    Solidario, el cual será el responsable de comunicarlo al resto de familiares
                                    que considere oportuno.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Décimo segundo. - Ambas partes, el
                                    Residente y sus Responsables Solidarios y el Centro, se comprometen a cumplir
                                    todas las Estipulaciones que le sean de aplicación contenidas en este contrato.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Ambas partes contratantes firman el
                                    presente contrato y a un solo efecto, en la localidad y fecha indicadas en el
                                    encabezamiento.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Firma: _______________________________________________<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">En su calidad de Residente y como conformidad
                                    a su ingreso.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Firma: ________________________________________________<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">En su calidad de Responsable Solidario.<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">Firma: ________________________________________________<o:p></o:p></span></p>
                                    
                                    <p class="MsoNormal" style="text-align:justify"><span lang="ES-MX" style="font-size:12.0pt;line-height:115%">En su calidad de Responsable de LOS
                                    OLIVOS ESTANCIAS.<o:p></o:p></span></p>
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