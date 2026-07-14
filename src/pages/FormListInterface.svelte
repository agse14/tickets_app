<script>
import TitleBar from "../TitleBar.svelte";
import {link} from 'svelte-spa-router';
import { pop, replace } from "svelte-spa-router";
import { onMount } from "svelte";
import { fun } from "../callable";

export let params = {};
  let tempId = params.node;
  let values = {
    order: '',
    template: 'app',
    hascreate:true,
    node: tempId
  };
  let loading = true;
  let form;
  let unsubscribe;
  let fields =[];
  let jsondata = "";
  let jsonarray = "";
  let jsonFields = {};
  let selFields = [];

  let selDuplicate = "_2";
  let selOrder = 1;
  let selDuplicateOrder = 1;

  let filterName = params.field;
  let filterValue = params.value;
  //console.log("got params",values);
  
  
  let ctype;
  let optionValue;
  let optionArray = [];

  
  let nameid;
  $: optionArray;
 


  if(filterName != undefined && filterValue != undefined){
        //console.log("filter : "+filterName+" == "+filterValue)
        values[filterName] = filterValue;
    }
  

  onMount(() => {
    form = document.getElementById('form');
    var defaultOptions = {};

    // touchspin
    jQuery('[data-toggle="touchspin"]').each(function (idx, obj) {
      var objOptions = jQuery.extend({}, defaultOptions, jQuery(obj).data());
      jQuery(obj)
        .TouchSpin(objOptions)
        .on("change", function () {
          //this.value
          // newResidents = this.value;
        });
    });
    jQuery(".input-mask").inputmask();
    loadData();
  });



  function loadData(){
    if(values.node != undefined && values.node != "" && tempId == null){
      //tempId = values.node;
      replace("/formlistinterface/"+values.node);
    }else{
      /*tempId = null;
      values = {};
      if(unsubscribe != undefined){
        unsubscribe();
      }*/
      //pop();

    }
    if (tempId == null) {
      loading = false;
    } else {
      console.log("Loading data from "+tempId);
      db.collection(tempId)
        .doc("data")
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
            console.log("no node data");
          } else {
            values = query.data();
            console.log("got node data", values);
            
          }
          loading = false;
        });
        unsubscribe = db.collection(tempId).doc("data").collection("schema").orderBy('order','asc').onSnapshot(async (querySnapshot) => {
        const tmp = [];
        
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            const tempequipmentsales = doc.data();
            tempequipmentsales.id = doc.id;
            tmp.push(tempequipmentsales);
            
        });
        fields = tmp;
        
    });
    }
  }

  function updateData() {
    
    
      db.collection(tempId)
        .doc("data")
        .set(values, { merge: true });
        
  }

function jsonToFields(){
  jsonFields = JSON.parse(jsondata);
  console.log("JSON data", jsonFields);

}
function jsonToFb(){
  if(jsonFields == undefined || Object.entries(jsonFields).length <= 0){
    return;
  }
  for (var [key, value] of Object.entries(jsonFields)) {
    db.collection(tempId)
        .doc("data")
        .collection("schema")
        .doc(value.id) //key
        .set(value, { merge: true });
  }
  jsonFields = {};
}
function jsonPythonToFb(){
  if(jsonFields == undefined || Object.entries(jsonFields).length <= 0){
    return;
  }
  for (var [key, value] of Object.entries(jsonFields)) {
    db.collection(tempId)
        .doc("data")
        .collection("schema")
        .doc(key) //key
        .set(value, { merge: true });
  }
  jsonFields = {};
}

function plusOne(field) {

  const indexOrder = (element) => element.id == field;
  let indexField = fields.findIndex(indexOrder);
  //console.log()
  //fields[indexField].order++;
  //console.log("plus",fields[indexField],field)
  //return;
  //var batch = db.batch();
  db.collection(tempId)
        .doc("data")
        .collection("schema")
        .doc(field)
        .update({order:fields[indexField].order+1});
  
}

function minusOne(field) {

  const indexOrder = (element) => element.id == field;
  let indexField = fields.findIndex(indexOrder);

  //fields[indexField].order--;
  db.collection(tempId)
        .doc("data")
        .collection("schema")
        .doc(field)
        .update({order:fields[indexField].order-1});

}


function deleteDoc(id) {
    Swal.fire({
                title: "¿Esta seguro?",
                text: "Desea eliminar este registro",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#34c38f",
                cancelButtonColor: "#f46a6a",
                confirmButtonText: "Si, borrarlo!"
              }).then(function (result) {
                if (result.value) {
                    db.collection(tempId)
                    .doc("data")
                    .collection("schema").doc(id).delete();
                }
            });
    
};

function duplicateFields(){
  if(selFields.length <=0){
    return;
  }
  var batch = db.batch();
  var newOrder = selDuplicateOrder;
  for (let index = 0; index < fields.length; index++) {
    const element = fields[index];
    if(selFields.includes(element.id) ){
      console.log("found", element);
      element.order = newOrder;
      batch.set(db.collection(tempId)
                    .doc("data")
                    .collection("schema").doc(element.id+selDuplicate), element);
      newOrder++;     
    }
    
    
  }

  batch.commit().then(() => {
    console.log("duplicados creados");
});
}

function addOrderToFields(){
  if(selFields.length <=0){
    return;
  }
  var batch = db.batch();
  for (let index = 0; index < fields.length; index++) {
    const element = fields[index];
    if(selFields.includes(element.id) ){
      console.log("found", element);
      element.order += selOrder;
      batch.update(db.collection(tempId)
                    .doc("data")
                    .collection("schema").doc(element.id), element);
                  
    }
    
  }

  batch.commit().then(() => {
      console.log("duplicados creados");
  });
}

function genArray(){
  jsonarray = "[";
  for (let index = 0; index < fields.length; index++) {
    const element = fields[index];
    jsonarray += JSON.stringify(element)+",\n";//"{id:'"+element.id+"',label:'"+element.label+"'},\n";
    
  }
  jsonarray += "]";
}
</script>

<div class="page-content">
  <TitleBar title="Formulario alta" base="Dashboard" />
  
  <div class="form-group row">
    <label for="example-number-input" class="col-md-2 col-form-label">Node</label>
    <div class="col-md-10">
    <input class="form-control" type="text" bind:value={values.node} id="node">
    {#if tempId == null}
    <button
    on:click={loadData}
    class="btn btn-primary waves-effect waves-light"
    disabled={loading}> {#if loading}<i class="bx bx-loader bx-spin font-size-16 align-middle mr-2"></i>{/if}
    Cargar</button>
    {:else}<a href="/formlistinterface" use:link class="btn btn-primary waves-effect waves-light">Quitar</a> {/if}
    </div>
  </div>
  
  <div class="row">
    <div class="col-12">
        <div class="card">
            <div class="card-body">

                <form id="form">            
  <div class="form-group row">
    <label for="example-text-input" class="col-md-2 col-form-label">Name-Id</label>
    <div class="col-md-10">
        <input class="form-control" type="text"  bind:value={values.nameId} id="nameId" >
    </div>
    </div>

    <div class="form-group row">
    <label for="example-text-input" class="col-md-2 col-form-label">Name-Singular</label>
    <div class="col-md-10">
        <input class="form-control" type="text"  bind:value={values.namesin} id="nameSin" >
    </div>
    </div>

    <div class="form-group row">
    <label for="example-text-input" class="col-md-2 col-form-label">Name-Plural</label>
    <div class="col-md-10">
        <input class="form-control" type="text"  bind:value={values.nameplr} id="namePlr">
    </div>
    </div>

    <div class="form-group row">
    <label for="example-text-input" class="col-md-2 col-form-label">Configuración</label>
    <div class="col-md-10">
        <input class="form-control" type="text"  bind:value={values.config} id="config">
    </div>
    </div>
    
    <div class="form-group row">
    <label for="example-text-input" class="col-md-2 col-form-label">Template</label>
    <div class="col-md-10">
        <input class="form-control" type="text"  bind:value={values.template} id="config">
    </div>
    </div>

    <div class="form-group row">
    <label for="example-number-input" class="col-md-2 col-form-label">Order</label>
    <div class="col-md-10">
    <input class="form-control" type="text" bind:value={values.order} id="ordertxt">
    </div>
    </div>
    
    
    

    <div class="form-group row">
      <div class="col-md-10">
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox"  id="chk_viewAdded" bind:checked={values.viewAdded}>
            <label class="form-check-label" for="chk_viewAdded" >
                Fecha en listado
            </label>
          </div>
        </div>
    </div>
    <div class="form-group row">
      <div class="col-md-10">
        <div class="form-check mb-2">
          <label class="form-check-label" for="chk_create" >
            Botones
          </label>
            <select name="buttons" id="btns" bind:value={values.buttons}>
              <option value={"crud"} selected>Editar y borrar</option>
              <option value={"edit"} >Editar</option>
              <option value={"duplicate"} >Duplicar, editar y borrar</option>
            </select>
          </div>
        </div>
    </div>
    

    <div class="form-group row">
      <div class="col-md-10">
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox"  id="chk_create" bind:checked={values.hascreate}>
            <label class="form-check-label" for="chk_create" >
                Generate Create
            </label>
          </div>
        </div>
    </div>
    <div class="form-group row">
      <div class="col-md-10">
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox"  id="chk_edit" bind:checked={values.hasedit}>
            <label class="form-check-label" for="chk_edit" >
              Generate Edit
            </label>
          </div>
        </div>
    </div>
    <div class="form-group row">
      <div class="col-md-10">
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox"  id="chk_store" bind:checked={values.hasstore}>
            <label class="form-check-label" for="chk_store" >
              Generate Store
            </label>
          </div>
        </div>
    </div>

                                        
        
        
    
  

</form>


        <button  type="button" 
            on:click={updateData}
            class="btn btn-primary waves-effect waves-light"
            disabled={loading}> {#if loading}<i class="bx bx-loader bx-spin font-size-16 align-middle mr-2"></i>{/if}
            Guardar</button>
          {#if loading}
            <div class="spinner-grow text-secondary m-1" role="status">
              <span class="sr-only">Guardando...</span>
            </div>
          {/if}
        

        
          <a href={"/formfieldsinterface/"+tempId} use:link class="btn btn-primary waves-effect waves-light">
            Agregar Campo</a>
        
          
</div>
</div>
</div>
</div>

<div class="row">
  <div class="col-12">
      <div class="card">
          <div class="card-body">
                <table>
                  <tr>
                    <th>Selección</th>
                    <th>Orden</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Render</th>
                    <th>Acciones</th>
                  </tr>
                  {#each fields as field}
                  <tr>
                    <td><input type=checkbox bind:group={selFields} value={field.id}></td>
                    <td><a class="waves-effect waves-light" on:click|preventDefault={()=>{plusOne(field.id)}} href="#"><i class="bx bx-plus"></i></a> {field.order} <a class="waves-effect waves-light"on:click|preventDefault={()=>{minusOne(field.id)}} href="#"><i class="bx bx-minus"></i></a></td>
                    <td>
                      <h5>{field.label}</h5>
                      {field.id}</td>
                    <td>{field.ctype}</td>
                    <td>{field.render}</td>
                    <td>
                      <a href={"/formfieldsinterface/"+tempId+"/"+field.id} use:link class="btn btn-secondary waves-effect waves-light">Editar</a>
                      <button  type="button" on:click={()=>{deleteDoc(field.id)}} class="btn btn-danger waves-effect waves-light"><i class="bx bx-x font-size-16 align-middle" ></i></button>
                      </td>
                  </tr>
                  {/each}
                </table>
                <div class="row">
                  <div class="col-12"><hr /></div>
                  <div class="col">Campos: {selFields}</div>
                </div>
                <div class="row">
                  <div class="col">
                    <h6>Agregar # al orden</h6>
                  </div>
                  <div class="col"><input type="number" bind:value={selOrder} /></div>
                  <div class="col"><button type="button" class="btn btn-outline-secondary" on:click={addOrderToFields}>Reordenar</button></div>
                  <div class="col-12"><hr /></div>
                </div>
                <div class="row">
                  <div class="col">
                    <h6>Duplicar con postfijo</h6>
                  </div>
                  <div class="col"><input type="text" placeholder="postfijo" bind:value={selDuplicate}  /></div>
                  <div class="col"> </div>
                </div>
                <div class="row">
                  <div class="col">
                    Orden inicial
                  </div>
                  <div class="col"><input type="number" placeholder="orden" bind:value={selDuplicateOrder}  /></div>
                  <div class="col"><button type="button" class="btn btn-outline-secondary" on:click={duplicateFields}>Duplicar</button></div>
                  <div class="col-12"><hr /></div>
                </div>
                <div class="row">
                  <div class="col">
                    <h6>Exportar propiedades</h6>
                  </div>
                  <div class="col"><input type="text" /></div>
                  <div class="col"><button type="button" class="btn btn-outline-secondary">Exportar</button></div>
                  <div class="col-12"><hr /></div>
                </div>
                <div class="row">
                  <div class="col">
                    <h6>Generar arreglo</h6>
                  </div>
                  <div class="col"><textarea name="jsonarray" id="jsonarray" cols="30" rows="10" bind:value={jsonarray}></textarea></div>
                  <div class="col"><button type="button" class="btn btn-outline-secondary" on:click={genArray}>Generar</button></div>
                  <div class="col-12"><hr /></div>
                </div>
            </div>
          </div>
        </div>

  </div>

  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <h4>Cargar de JSON</h4>
          <textarea name="json" id="json" cols="30" rows="10" bind:value={jsondata}></textarea>
          <button  type="button" class="btn btn-secondary waves-effect waves-light" on:click={jsonToFields}>Leer</button>
            </div>
            <div class="col-md-6">
              {#if Object.entries(jsonFields).length  > 0}
            <ul>
              {#each Object.entries(jsonFields) as [jk,jf]}
              <li>{jk}: {jf.label} - {jf.ctype}</li>
              {/each}
            </ul>
            <button  type="button" class="btn btn-secondary waves-effect waves-light" on:click={jsonToFb}>Cargar</button>
            <button  type="button" class="btn btn-secondary waves-effect waves-light" on:click={jsonPythonToFb}>Cargar(Python)</button>
          {/if}
            </div>

            

          </div>
          
          
        </div>
      </div>
    </div>
  </div>
</div> 
