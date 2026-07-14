<script>
  import TitleBar from "../TitleBar.svelte";
  import {link} from 'svelte-spa-router';
  import { pop, replace } from "svelte-spa-router";
  import { onMount } from "svelte";
  import { fun } from "../callable";
import PastInventoryEdit from "./PastInventoryEdit.svelte";

  export let params = {};
  export let values = {};
   
  const tempId = params.bid;
    



 
    
    
      db.collection("patients")
        .doc(tempId)
        .get()
        .then(function (query) {
            values = query.data();
        })
          
        
    


  


  let today = DateTime.local()
            .setLocale("es-mx").toLocaleString(DateTime.DATE_FULL);

            
         
        

          
  

  </script>
  


<div class="page-content">
  <TitleBar title="Carta de alta" base="Dashboard" />
  
  
  
  <div class="row">
    <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="card-body">

              <div class="invoice-title">
                <h4 class="float-right font-size-16">Fecha: {today}</h4>
                <br>
              </div>
              <br>
              <br>
              <br>
            </div>

            <div class="card-body">
              <div class="row">
               
                <p>Yo: <strong>{values.responsible_name}</strong>   Parentesco: <strong>{values.responsible_relationship}</strong> Responsable o representante de la huesped: <strong>{values.name}</strong> Residente de los olivos Estancia/Sucursal: <strong>{values.branch}</strong>.</p>
              
              </div>
              <br>
              <br>
              <br>
            </div>

            <div class="card-body">
              <div class="row">
                <p>Certifico que he sido informada con claridad, que en caso de ser necesario o se estime
                  conveniente se utilizara SUJETACION para cuidar de forma integral el bienestar del residente, bajar
                  el riesgo de caída y en caso de crisis que se lastime o agreda a alguien.
                  Informando al familiar responsable y al médico tratante la situación y darle el seguimiento e
                  indicaciones que se indiquen.
                  </p>

              </div>
              <br>
              <br>
              <br>
            </div>

            <div class="card-body">
              <h6>Comentarios u Observaciones</h6>
            
              <div class="form-group row"><div class="col-md-8"><textarea class="form-control " type="text"></textarea>
               </div> 
               <br>
              <br>
              <br>
            </div>
            <br>
              <br>
              <br>

            <div class="card-body">
              <div class="row">
                <div class="col">
                <p style="text-align:left">Nombre del Residente</p><br>
                <p style="text-align:left"><strong>{values.name}</strong></p>
                </div>
                <div class="col">
                  <p style="text-align:right">Nombre y firma del responsable</p><br>
                  <p style="text-align:right"><strong>{values.responsible_name}</strong></p>
                  </div>
                </div>
              </div>
              <br>
              <br>
              <br>

              <div class="card-body">
                
                  <div class="col">
                  <p style="text-align:center">Representante los Olivos estancia</p>
                  </div>
                  
                  
                </div>

                <div>
                  <button type="button" class="btn btn-outline-success" onclick="window.print()">Imprimir Carta de Alta</button>
                </div>


              
              </div>
          </div>
      </div>
    </div>
  </div>
</div> 