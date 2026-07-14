<script>
    import { link } from "svelte-spa-router";
import TitleBar from "../TitleBar.svelte";
import {permissions} from "../stores.js";


let week = [{id:202022, name:'Lunes'},'Martes','Miercoles'];
let sid = "coasdasdas";
let pos = ['Encargado','Asiostente','Chef']

function copy(){
    return;
    alert('copiando');
    db.collection("partners").doc('base').get().then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
          } else {
            var values = query.data();
            db.collection("personal").doc('base').set(values);
          }
        });

}
function updateEmailBody() {
    let newBody= `
    <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="x_bodyTable"
    style="border-collapse:collapse; height:100%; margin:0; padding:0; width:100%; background-color:#FFFFFF">
    <tbody>
        <tr>
            <td align="center" valign="top" id="x_bodyCell"
                style="height:100%; margin:0; padding:0; width:100%; border-top:0">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
                    <tbody>
                        <tr>
                            <td align="center" valign="top" id="x_templatePreheader"
                                style="background:#00c6ff url('https://losolivosestancias.com.mx/mailing/images/pin_blue.jpg') no-repeat center/cover; background-color:#00c6ff; background-image:url(https://losolivosestancias.com.mx/mailing/images/pin_blue.jpg); background-repeat:no-repeat; background-position:center; background-size:cover; border-top:0; border-bottom:0; padding-top:40px; padding-bottom:40px">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    class="x_templateContainer"
                                    style="border-collapse:collapse; max-width:600px!important">
                                    <tbody>
                                        <tr>
                                            <td valign="top" class="x_preheaderContainer" style="">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnImageBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnImageBlockOuter">
                                                        <tr>
                                                            <td valign="top" class="x_mcnImageBlockInner"
                                                                style="padding:9px">
                                                                <table align="left" width="100%" border="0"
                                                                    cellpadding="0" cellspacing="0"
                                                                    class="x_mcnImageContentContainer"
                                                                    style="min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="x_mcnImageContent" valign="top"
                                                                                style="padding-right:9px; padding-left:9px; padding-top:0; padding-bottom:0; text-align:center">
                                                                                <img data-imagetype="External"
                                                                                    src="https://losolivosestancias.com.mx/mailing/images/logow.png"
                                                                                    align="center" alt="" width="180"
                                                                                    class="x_mcnRetinaImage"
                                                                                    style="max-width:360px; padding-bottom:0; display:inline!important; vertical-align:bottom; border:0; height:auto; outline:none; text-decoration:none">
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnDividerBlock"
                                                    style="min-width:100%; border-collapse:collapse; table-layout:fixed!important">
                                                    <tbody class="x_mcnDividerBlockOuter">
                                                        <tr>
                                                            <td class="x_mcnDividerBlockInner"
                                                                style="min-width:100%; padding:15px 18px">
                                                                <table class="x_mcnDividerContent" border="0"
                                                                    cellpadding="0" cellspacing="0" width="100%"
                                                                    style="min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td style=""><span></span></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnTextBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnTextBlockOuter">
                                                        <tr>
                                                            <td valign="top" class="x_mcnTextBlockInner"
                                                                style="padding-top:9px">
                                                                <table align="left" border="0" cellpadding="0"
                                                                    cellspacing="0" width="100%"
                                                                    class="x_mcnTextContentContainer"
                                                                    style="max-width:100%; min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td valign="top" class="x_mcnTextContent"
                                                                                style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px; word-break:break-word; color:#ffffff; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:20px; line-height:150%; text-align:center">
                                                                                <strong><span
                                                                                        style="font-size:36px">Notificación</span></strong>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" valign="top" id="x_templateHeader"
                                style="background:#443f35 none no-repeat center/cover; background-color:#443f35; background-image:none; background-repeat:no-repeat; background-position:center; background-size:cover; border-top:0; border-bottom:0; padding-top:0px; padding-bottom:0px">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    class="x_templateContainer"
                                    style="border-collapse:collapse; max-width:600px!important">
                                    <tbody>
                                        <tr>
                                            <td valign="top" class="x_headerContainer" style="">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnTextBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnTextBlockOuter">
                                                        <tr>
                                                            <td valign="top" class="x_mcnTextBlockInner"
                                                                style="padding-top:9px">
                                                                <table align="left" border="0" cellpadding="0"
                                                                    cellspacing="0" width="100%"
                                                                    class="x_mcnTextContentContainer"
                                                                    style="max-width:100%; min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td valign="top" class="x_mcnTextContent"
                                                                                style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px; word-break:break-word; color:#FFFFFF; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; line-height:200%; text-align:left">
                                                                                <div
                                                                                    style="text-align:left; float:left">
                                                                                    <a href="tel:528443585507"
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        data-auth="NotApplicable"
                                                                                        class="x_center-text"
                                                                                        style="text-align:left; color:#FFFFFF; text-decoration:none; font-weight:normal"
                                                                                        data-linkindex="0">Soporte: +528443585507</a></div>
                                                                                <div
                                                                                    style="text-align:right; float:right">
                                                                                    <a href="https://ubicare.mx/app"
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        data-auth="Verified"
                                                                                        class="x_center-text"
                                                                                        shash="WHINZJCtDn9/a5UBLet8Cvoi3yNPYWO3iayILINs2p1JYz13WaCpoQ3/FdeojUWqCHvOiMZcvglWEi8i1oVVK2GWl8J5DAp8cP83sMlKMpDXA3Xd90OpPsGwtOI7+kEdRQYoBCFxTSQsz0u411J5n7WSdcgY/eOJYOVZjkeYMik="
                                                                                        style="text-align:right; color:#FFFFFF; font-weight:normal; text-decoration:none"
                                                                                        title="Descarga nuestra app"
                                                                                        data-linkindex="1">Descarga el App</a></div>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" valign="top" id="x_templateBody"
                                style="background:#ffffff repeat-x top/contain; background-color:#ffffff;background-repeat:repeat-x; background-position:top; background-size:contain; border-top:0; border-bottom:0; padding-top:30px; padding-bottom:0">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    class="x_templateContainer"
                                    style="border-collapse:collapse; max-width:600px!important">
                                    <tbody>
                                        <tr>
                                            <td valign="top" class="x_bodyContainer" style="">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnTextBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnTextBlockOuter">
                                                        <tr>
                                                            <td valign="top" class="x_mcnTextBlockInner"
                                                                style="padding-top:9px">
                                                                <table align="left" border="0" cellpadding="0"
                                                                    cellspacing="0" width="100%"
                                                                    class="x_mcnTextContentContainer"
                                                                    style="max-width:100%; min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td valign="top" class="x_mcnTextContent"
                                                                                style="padding-top:0; padding-right:18px; padding-bottom:9px; padding-left:18px; word-break:break-word; color:#443f35; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:18px; line-height:150%; text-align:center">
                                                                                <h2 class="x_null" itemprop="headline"
                                                                                    style="text-align:center; display:block; margin:0; padding:0; color:#443f35; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:24px; font-style:normal; font-weight:bold; line-height:125%; letter-spacing:normal">
                                                                                    {{title}}</h2>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnImageBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnImageBlockOuter">
                                                        <tr>
                                                            <td valign="top" class="x_mcnImageBlockInner"
                                                                style="padding:9px">
                                                                <table align="left" width="100%" border="0"
                                                                    cellpadding="0" cellspacing="0"
                                                                    class="x_mcnImageContentContainer"
                                                                    style="min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td class="x_mcnImageContent" valign="top"
                                                                                style="padding-right:9px; padding-left:9px; padding-top:0; padding-bottom:0; text-align:center">
                                                                                <a href="{{action}}"
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    title="{{title}}"
                                                                                    class="" style=""
                                                                                    data-linkindex="2">{{image}}
                                                                                </a></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnTextBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnTextBlockOuter">
                                                        <tr>
                                                            <td valign="top" class="x_mcnTextBlockInner"
                                                                style="padding-top:9px">
                                                                <table align="left" border="0" cellpadding="0"
                                                                    cellspacing="0" width="100%"
                                                                    class="x_mcnTextContentContainer"
                                                                    style="max-width:100%; min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td valign="top" class="x_mcnTextContent"
                                                                                style="padding:0px 18px 9px; line-height:150%; word-break:break-word; color:#443f35; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:18px; text-align:center">
                                                                                <p
                                                                                    style="text-align:justify; line-height:150%; margin:10px 0; padding:0; color:#443f35; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:18px">
                                                                                    {{body}}</p>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnButtonBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnButtonBlockOuter">
                                                        <tr>
                                                            <td valign="top" align="center"
                                                                class="x_mcnButtonBlockInner"
                                                                style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px">
                                                                <table border="0" cellpadding="0" cellspacing="0"
                                                                    class="x_mcnButtonContentContainer"
                                                                    style="border-collapse:separate!important; border-radius:3px; background-color:#00c6ff">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td align="center" valign="middle"
                                                                                class="x_mcnButtonContent"
                                                                                style="font-family:Arial; font-size:16px; padding:15px">
                                                                                <a href="{{action}}"
                                                                                    target="_blank"
                                                                                    class="x_mcnButton"
                                                                                    title="{{button}}"
                                                                                    style="font-weight:bold; letter-spacing:normal; line-height:100%; text-align:center; text-decoration:none; color:#FFFFFF; display:block"
                                                                                    data-linkindex="3">{{button}}</a>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnDividerBlock"
                                                    style="min-width:100%; border-collapse:collapse; table-layout:fixed!important">
                                                    <tbody class="x_mcnDividerBlockOuter">
                                                        <tr>
                                                            <td class="x_mcnDividerBlockInner"
                                                                style="min-width:100%; padding:18px">
                                                                <table class="x_mcnDividerContent" border="0"
                                                                    cellpadding="0" cellspacing="0" width="100%"
                                                                    style="min-width:100%; border-top:2px solid #EAEAEA; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td style=""><span></span></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" valign="top" id="x_templateUpperColumns"
                                style="background:transparent none no-repeat center/cover; background-color:transparent; background-image:none; background-repeat:no-repeat; background-position:center; background-size:cover; border-top:0; border-bottom:0; padding-top:15px; padding-bottom:20px">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                    class="x_templateContainer"
                                    style="border-collapse:collapse; max-width:600px!important">
                                    <tbody>
                                        <tr>
                                            <td valign="top" style="">
                                                <table align="left" border="0" cellpadding="0" cellspacing="0"
                                                    width="200" class="x_columnWrapper"
                                                    style="border-collapse:collapse">
                                                    <tbody>
                                                        <tr>
                                                            <td valign="top" class="x_columnContainer" style=""></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table align="left" border="0" cellpadding="0" cellspacing="0"
                                                    width="200" class="x_columnWrapper"
                                                    style="border-collapse:collapse">
                                                    <tbody>
                                                        <tr>
                                                            <td valign="top" class="x_columnContainer" style=""></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table align="left" border="0" cellpadding="0" cellspacing="0"
                                                    width="200" class="x_columnWrapper"
                                                    style="border-collapse:collapse">
                                                    <tbody>
                                                        <tr>
                                                            <td valign="top" class="x_columnContainer" style=""></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td align="center" valign="top" id="x_templateFooter"
                                style="background:#00c6ff url('https://losolivosestancias.com.mx/mailing/images/nurses.jpg') no-repeat center/cover; background-color:#00c6ff; background-image:url(https://losolivosestancias.com.mx/mailing/images/nurses.jpg); background-repeat:no-repeat; background-position:center; background-size:cover; border-top:0; border-bottom:0; padding-top:30px; padding-bottom:30px">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    class="x_templateContainer"
                                    style="border-collapse:collapse; max-width:600px!important">
                                    <tbody>
                                        <tr>
                                            <td valign="top" class="x_footerContainer" style="">
                                               
                                                
                                                
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnFollowBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnFollowBlockOuter">
                                                        <tr>
                                                            <td align="center" valign="top"
                                                                class="x_mcnFollowBlockInner" style="padding:9px">
                                                                <table border="0" cellpadding="0" cellspacing="0"
                                                                    width="100%" class="x_mcnFollowContentContainer"
                                                                    style="min-width:100%; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td align="center"
                                                                                style="padding-left:9px; padding-right:9px">
                                                                                <table border="0" cellpadding="0"
                                                                                    cellspacing="0" width="100%"
                                                                                    class="x_mcnFollowContent"
                                                                                    style="min-width:100%; border-collapse:collapse">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td align="center"
                                                                                                valign="top"
                                                                                                style="padding-top:9px; padding-right:9px; padding-left:9px">
                                                                                                <table align="center"
                                                                                                    border="0"
                                                                                                    cellpadding="0"
                                                                                                    cellspacing="0"
                                                                                                    style="border-collapse:collapse">
                                                                                                    <tbody>
                                                                                                        <tr>
                                                                                                            <td align="center"
                                                                                                                valign="top"
                                                                                                                style="">
                                                                                                                <table
                                                                                                                    align="left"
                                                                                                                    border="0"
                                                                                                                    cellpadding="0"
                                                                                                                    cellspacing="0"
                                                                                                                    style="display:inline; border-collapse:collapse">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td valign="top"
                                                                                                                                class="x_mcnFollowContentItemContainer"
                                                                                                                                style="padding-right:10px; padding-bottom:9px">
                                                                                                                                <table
                                                                                                                                    border="0"
                                                                                                                                    cellpadding="0"
                                                                                                                                    cellspacing="0"
                                                                                                                                    width="100%"
                                                                                                                                    class="x_mcnFollowContentItem"
                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td align="left"
                                                                                                                                                valign="middle"
                                                                                                                                                style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px">
                                                                                                                                                <table
                                                                                                                                                    align="left"
                                                                                                                                                    border="0"
                                                                                                                                                    cellpadding="0"
                                                                                                                                                    cellspacing="0"
                                                                                                                                                    width=""
                                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td align="center"
                                                                                                                                                                valign="middle"
                                                                                                                                                                width="24"
                                                                                                                                                                class="x_mcnFollowIconContent"
                                                                                                                                                                style="">
                                                                                                                                                                <a href="https://ubicare.mx"
                                                                                                                                                                    target="_blank"><img
                                                                                                                                                                        data-imagetype="External"
                                                                                                                                                                        src="https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-facebook-48.png"
                                                                                                                                                                        height="24"
                                                                                                                                                                        width="24"
                                                                                                                                                                        class=""
                                                                                                                                                                        style="display:block; border:0; height:auto; outline:none; text-decoration:none"></a>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                                <table
                                                                                                                    align="left"
                                                                                                                    border="0"
                                                                                                                    cellpadding="0"
                                                                                                                    cellspacing="0"
                                                                                                                    style="display:inline; border-collapse:collapse">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td valign="top"
                                                                                                                                class="x_mcnFollowContentItemContainer"
                                                                                                                                style="padding-right:10px; padding-bottom:9px">
                                                                                                                                <table
                                                                                                                                    border="0"
                                                                                                                                    cellpadding="0"
                                                                                                                                    cellspacing="0"
                                                                                                                                    width="100%"
                                                                                                                                    class="x_mcnFollowContentItem"
                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td align="left"
                                                                                                                                                valign="middle"
                                                                                                                                                style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px">
                                                                                                                                                <table
                                                                                                                                                    align="left"
                                                                                                                                                    border="0"
                                                                                                                                                    cellpadding="0"
                                                                                                                                                    cellspacing="0"
                                                                                                                                                    width=""
                                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td align="center"
                                                                                                                                                                valign="middle"
                                                                                                                                                                width="24"
                                                                                                                                                                class="x_mcnFollowIconContent"
                                                                                                                                                                style="">
                                                                                                                                                                <a href="https://ubicare.mx"
                                                                                                                                                                    target="_blank"><img
                                                                                                                                                                        data-imagetype="External"
                                                                                                                                                                        src="https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-twitter-48.png"
                                                                                                                                                                        height="24"
                                                                                                                                                                        width="24"
                                                                                                                                                                        class=""
                                                                                                                                                                        style="display:block; border:0; height:auto; outline:none; text-decoration:none"></a>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                                <table
                                                                                                                    align="left"
                                                                                                                    border="0"
                                                                                                                    cellpadding="0"
                                                                                                                    cellspacing="0"
                                                                                                                    style="display:inline; border-collapse:collapse">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td valign="top"
                                                                                                                                class="x_mcnFollowContentItemContainer"
                                                                                                                                style="padding-right:10px; padding-bottom:9px">
                                                                                                                                <table
                                                                                                                                    border="0"
                                                                                                                                    cellpadding="0"
                                                                                                                                    cellspacing="0"
                                                                                                                                    width="100%"
                                                                                                                                    class="x_mcnFollowContentItem"
                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td align="left"
                                                                                                                                                valign="middle"
                                                                                                                                                style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px">
                                                                                                                                                <table
                                                                                                                                                    align="left"
                                                                                                                                                    border="0"
                                                                                                                                                    cellpadding="0"
                                                                                                                                                    cellspacing="0"
                                                                                                                                                    width=""
                                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td align="center"
                                                                                                                                                                valign="middle"
                                                                                                                                                                width="24"
                                                                                                                                                                class="x_mcnFollowIconContent"
                                                                                                                                                                style="">
                                                                                                                                                                <a href="https://ubicare.mx"
                                                                                                                                                                    target="_blank"><img
                                                                                                                                                                        data-imagetype="External"
                                                                                                                                                                        src="https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-linkedin-48.png"
                                                                                                                                                                        height="24"
                                                                                                                                                                        width="24"
                                                                                                                                                                        class=""
                                                                                                                                                                        style="display:block; border:0; height:auto; outline:none; text-decoration:none"></a>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                                <table
                                                                                                                    align="left"
                                                                                                                    border="0"
                                                                                                                    cellpadding="0"
                                                                                                                    cellspacing="0"
                                                                                                                    style="display:inline; border-collapse:collapse">
                                                                                                                    <tbody>
                                                                                                                        <tr>
                                                                                                                            <td valign="top"
                                                                                                                                class="x_mcnFollowContentItemContainer"
                                                                                                                                style="padding-right:0; padding-bottom:9px">
                                                                                                                                <table
                                                                                                                                    border="0"
                                                                                                                                    cellpadding="0"
                                                                                                                                    cellspacing="0"
                                                                                                                                    width="100%"
                                                                                                                                    class="x_mcnFollowContentItem"
                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                    <tbody>
                                                                                                                                        <tr>
                                                                                                                                            <td align="left"
                                                                                                                                                valign="middle"
                                                                                                                                                style="padding-top:5px; padding-right:10px; padding-bottom:5px; padding-left:9px">
                                                                                                                                                <table
                                                                                                                                                    align="left"
                                                                                                                                                    border="0"
                                                                                                                                                    cellpadding="0"
                                                                                                                                                    cellspacing="0"
                                                                                                                                                    width=""
                                                                                                                                                    style="border-collapse:collapse">
                                                                                                                                                    <tbody>
                                                                                                                                                        <tr>
                                                                                                                                                            <td align="center"
                                                                                                                                                                valign="middle"
                                                                                                                                                                width="24"
                                                                                                                                                                class="x_mcnFollowIconContent"
                                                                                                                                                                style="">
                                                                                                                                                                <a href="https://ubicare.mx"
                                                                                                                                                                    target="_blank"
                                                                                                                                                                    rel="noopener noreferrer"
                                                                                                                                                                    ><img
                                                                                                                                                                        data-imagetype="External"
                                                                                                                                                                        src="https://cdn-images.mailchimp.com/icons/social-block-v2/outline-light-youtube-48.png"
                                                                                                                                                                        height="24"
                                                                                                                                                                        width="24"
                                                                                                                                                                        class=""
                                                                                                                                                                        style="display:block; border:0; height:auto; outline:none; text-decoration:none"></a>
                                                                                                                                                            </td>
                                                                                                                                                        </tr>
                                                                                                                                                    </tbody>
                                                                                                                                                </table>
                                                                                                                                            </td>
                                                                                                                                        </tr>
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    </tbody>
                                                                                                                </table>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnTextBlock"
                                                    style="min-width:100%; border-collapse:collapse">
                                                    <tbody class="x_mcnTextBlockOuter">
                                                        <tr>
                                                            <td valign="top" class="x_mcnTextBlockInner"
                                                                style="padding-top:9px">
                                                                <table align="left" border="0" cellpadding="0"
                                                                    cellspacing="0" width="100%"
                                                                    class="x_mcnTextContentContainer"
                                                                    style="max-width:300px; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td valign="top" class="x_mcnTextContent"
                                                                                style="padding-top:0; padding-left:18px; padding-bottom:9px; padding-right:18px; word-break:break-word; color:#ffffff; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:12px; line-height:150%; text-align:left">
                                                                                <div style="text-align:center">Nuestras oficinas:<br
                                                                                        aria-hidden="true">
                                                                                    <div class="x_vcard"><span
                                                                                            class="x_org x_fn">Ubicare</span>
                                                                                        <div class="x_adr">
                                                                                            <div
                                                                                                class="x_street-address">
                                                                                                Zaragoza 220
                                                                                            </div>
                                                                                           <span
                                                                                                class="x_locality">Monterrey</span>,
                                                                                            <span
                                                                                                class="x_region">Nuevo León</span>
                                                                                            <span
                                                                                                class="x_postal-code">64000</span>
                                                                                        </div><br aria-hidden="true"><a
                                                                                            href="mail:contacto@ubicare.mx"
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            class="x_hcard-download"
                                                                                            title="Enviar correo electrónico a Ubicare"
                                                                                            data-linkindex="25">Añadenos a tus contactos</a>
                                                                                    </div><br aria-hidden="true">
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                                <table align="left" border="0" cellpadding="0"
                                                                    cellspacing="0" width="100%"
                                                                    class="x_mcnTextContentContainer"
                                                                    style="max-width:300px; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td valign="top" class="x_mcnTextContent"
                                                                                style="padding-top:0; padding-left:18px; padding-bottom:9px; padding-right:18px; word-break:break-word; color:#ffffff; font-family:'Roboto','Helvetica Neue',Helvetica,Arial,sans-serif; font-size:12px; line-height:150%; text-align:left">
                                                                                <div style="text-align:center">¿No quieres recibír estos correos?<br aria-hidden="true"><a
                                                                                        href="https://ubicare.mx/unsubscribe/{{uid}}"
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        style="color:#cdd8b5; font-weight:normal; text-decoration:underline"
                                                                                        title="Quitar subscripción de Ubicare"
                                                                                        data-linkindex="27">Dar de baja</a></div>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                                    class="x_mcnDividerBlock"
                                                    style="min-width:100%; border-collapse:collapse; table-layout:fixed!important">
                                                    <tbody class="x_mcnDividerBlockOuter">
                                                        <tr>
                                                            <td class="x_mcnDividerBlockInner"
                                                                style="min-width:100%; padding:25px 18px">
                                                                <table class="x_mcnDividerContent" border="0"
                                                                    cellpadding="0" cellspacing="0" width="100%"
                                                                    style="min-width:100%; border-top:1px solid #CDD8B5; border-collapse:collapse">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td style=""><span></span></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table>
    `;
  const emailRef = db.collection("emails").doc("ubicare_generic");

  return emailRef.update({
    body: newBody
  })
  .then(() => {
    console.log("Email body updated successfully!");
  })
  .catch((error) => {
    console.error("Error updating email body: ", error);
  });
}



import { onMount } from "svelte";
import RoomsWidget from "./RoomsWidget.svelte";
    // import TitleBar from "../TitleBar.svelte";
    // import { permissions } from "../stores.js";
    let draggableWidget;
    let roomsByBranchesAndStatus = {};
    let rooms = [];
    // Widget control
let widgetList = [
    { id: 'rooms', name: 'Habitaciones disponibles', visible: false }
];
let dragging = false;
let widgetX = 20;
let widgetY = 0;

// Restaurar posición desde localStorage al cargar
if (typeof window !== 'undefined') {
    const savedPos = localStorage.getItem('roomsWidgetPos');
    if (savedPos) {
        try {
            const { x, y } = JSON.parse(savedPos);
            widgetX = x ?? widgetX;
            widgetY = y ?? widgetY;
        } catch {}
    }
}
let offsetX = 0;
let offsetY = 0;

    onMount(() => {
        // Lógica similar a BranchesReport para obtener habitaciones disponibles
        db.collection("room_inventory")
            .orderBy('added','desc')
            .onSnapshot((querySnapshot) => {
                const tmp = [];
                querySnapshot.forEach((doc) => {
                    const room = doc.data();
                    room.id = doc.id;
                    // Solo habitaciones disponibles (status == 1)
                    if (room.status === 1 && room.test !== true) {
                        tmp.push(room);
                    }
                });
                rooms = tmp;
                // Agrupar por sucursal
                roomsByBranchesAndStatus = {};
                rooms.forEach(room => {
                    const branch = room.branches;
                    if (!roomsByBranchesAndStatus[branch]) {
                        roomsByBranchesAndStatus[branch] = [];
                    }
                    roomsByBranchesAndStatus[branch].push(room);
                });
            });
    });

    function startDrag(event) {
        dragging = true;
        // Calcular offset respecto a la posición actual del widget
        offsetX = event.clientX - widgetX;
        offsetY = event.clientY - widgetY;
        window.addEventListener('mousemove', drag);
        window.addEventListener('mouseup', stopDrag);
    }
    function drag(event) {
        if (dragging) {
            // Obtener dimensiones del card-body
            const cardBody = draggableWidget?.parentElement;
            const widgetRect = draggableWidget?.getBoundingClientRect();
            const cardRect = cardBody?.getBoundingClientRect();
            // Calcular nueva posición
            let newX = event.clientX - offsetX;
            let newY = event.clientY - offsetY;
            // Limitar dentro del card-body
            if (cardRect && widgetRect) {
                // Limitar X
                if (newX < 0) newX = 0;
                if (newX > cardRect.width - widgetRect.width) newX = cardRect.width - widgetRect.width;
                // Limitar Y
                if (newY < 0) newY = 0;
                if (newY > cardRect.height - widgetRect.height) newY = cardRect.height - widgetRect.height;
            }
            widgetX = newX;
            widgetY = newY;
        }
    }
    function stopDrag() {
        dragging = false;
        window.removeEventListener('mousemove', drag);
        window.removeEventListener('mouseup', stopDrag);
        // Guardar posición en localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('roomsWidgetPos', JSON.stringify({ x: widgetX, y: widgetY }));
        }
    }
    function toggleWidget(id) {
        widgetList = widgetList.map(w =>
            w.id === id ? { ...w, visible: !w.visible } : w
        );
    }
</script>

<div class="page-content">
    <TitleBar title="Inicio" base="Dashboard" />
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body" style="position:relative; min-height:500px;">
                    <h4 class="card-title mb-4">Bienvenido</h4>
                    <p>Sistema de seguimiento a tickets</p>
                    <div class="text-center">
                        {#if $permissions && $permissions.supervision_tags}
                            <a href="/cardclose" use:link class="btn btn-primary">Cierre de turno</a>
                        {/if}
                    </div>
                    <!-- Listado de widgets con switches solo para admin -->
                    
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.draggable-widget {
    user-select: none;
    transition: box-shadow 0.2s;
}
.draggable-widget:active {
    box-shadow: 0 4px 16px #0004;
}
</style>