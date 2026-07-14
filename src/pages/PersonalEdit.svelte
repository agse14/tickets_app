<script>
  import { link } from "svelte-spa-router";
  import { pop } from "svelte-spa-router";
  import TitleBar from "../TitleBar.svelte";
  import { onMount } from "svelte";
  import TypeListSelect from "../controls/TypeListSelect.svelte"
import GenderListSelect from "../controls/GenderListSelect.svelte"
import ImageField from "../controls/ImageField.svelte";


  export let params = {};

  let values = {};
  let loading = true;
  let form;

  let filterName = params.field;
  let filterValue = params.value;
  
  const tempId = params.bid;
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
          newResidents = this.value;
        });
    });
    jQuery(".input-mask").inputmask();
    if (tempId == null) {
      loading = false;
    } else {
      db.collection("personal")
        .doc(tempId)
        .get()
        .then(function (query) {
          if (query == null || query == undefined || query.data() == null) {
            //No data crear
            //pop();
          } else {
            values = query.data();
            
          }
          loading = false;
        });
    }
  });

  function cancel() {
    pop();
  }

  function updateData() {
    
    if(!form.checkValidity()){
      form.reportValidity();
      /*
        jQuery(".tab-pane").length
        for(var elem of form.elements){
          if(!elem.checkValidity()){ 
            $('.nav-tabs a[href="#personal-tab"]').tab('show');
            form.reportValidity();
            console.log(elem);
          }
        };
      */
      return;
    }
    loading = true;
    if (tempId != null) {
      //Actualizar si tiene id
      values.edited = timenow;
      db.collection("personal")
        .doc(tempId)
        .update(values)
        .then(function () {
          loading = false;
          pop();
        });
    } else {
      //Crear nuevo si no tiene
      values.added = timenow;
      db.collection("personal")
        .add(values)
        .then(function () {
          loading = false;
          pop();
        });
    }
  }
</script>

<div class="page-content">
  <TitleBar title="Agregar Personal" base="Inventario" />
<form id="form">
  <div class="row">
        
<div class="col-md-12 col-xl-4">
	<div class="card">
	<div class="card-body">
	<div class="custom-control custom-switch mb-2" dir="ltr">
	<input type="checkbox" class="custom-control-input" id="activeSwitch" bind:checked={values.active}>
	<label class="custom-control-label" for="activeSwitch">Activo</label>
	</div>
	<div class="form-group row"><label for="picture" class="col-12 col-form-label">Foto</label> 
	<div class="col-12">  <ImageField bind:value={values.picture} node={values.id}  /> </div>
	</div>

	<div class="form-group row"><label for="name" class="col-md-4 col-form-label">Nombre</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.name} id="name"  required /> </div> </div>

	<div class="form-group row"><label for="lastname" class="col-md-4 col-form-label">Apellidos</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.lastname} id="lastname"  required /> </div> </div>

	<div class="form-group row"><label for="email" class="col-md-4 col-form-label">Email de contacto</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.email} id="email"  required /> </div> </div>

	<div class="form-group row"><label for="type" class="col-md-4 col-form-label">Tipo</label> <div class="col-md-4"><TypeListSelect bind:value={values.type} inlist={false} /> </div> </div>
</div>
	</div>
	</div>

<div class="col">
	<div class="card">
	<div class="card-body">
	<h3>Ficha de empleado</h3>
<ul class="nav nav-tabs nav-tabs-custom nav-justified" role="tablist">
	<li class="nav-item">
	<a class="nav-link active" data-toggle="tab" href="#personal-tab" role="tab">
		<span class="d-block d-sm-none"><i class="fas fa-home"></i></span>
		<span class="d-none d-sm-block">Datos Personales</span>
	</a>
	</li>
	<li class="nav-item">
	<a class="nav-link " data-toggle="tab" href="#address-tab" role="tab">
		<span class="d-block d-sm-none"><i class="fas fa-home"></i></span>
		<span class="d-none d-sm-block">Dirección</span>
	</a>
	</li>
	<li class="nav-item">
	<a class="nav-link " data-toggle="tab" href="#contact-tab" role="tab">
		<span class="d-block d-sm-none"><i class="fas fa-home"></i></span>
		<span class="d-none d-sm-block">Referencias</span>
	</a>
	</li>
</ul>
<div class="tab-content p-3 text-muted">
	<div class="tab-pane active" id="personal-tab" role="tabpanel">
	<div class="form-group row"><label for="birth" class="col-md-4 col-form-label">Fecha de nacimiento</label> <div class="col-md-8"> <input class="form-control" type="date" bind:value={values.birth} id="birth"  required /> </div> </div>

	<div class="form-group row"><label for="birth_place" class="col-md-4 col-form-label">Lugar de nacimiento</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.birth_place} id="birth_place"  /> </div> </div>

	<div class="form-group row"><label for="birth_contry" class="col-md-4 col-form-label">Nacionalidad</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.birth_contry} id="birth_contry"  /> </div> </div>

	<div class="form-group row"><label for="gender" class="col-md-4 col-form-label">Sexo</label> <div class="col-md-4"><GenderListSelect bind:value={values.gender} inlist={false} /> </div> </div>

	<div class="form-group row"><label for="civil" class="col-md-4 col-form-label">Estado Civil</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.civil} id="civil"  /> </div> </div>

	<div class="form-group row"><label for="study" class="col-md-4 col-form-label">Nivel de Estudios</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.study} id="study"  /> </div> </div>

	<div class="form-group row"><label for="height" class="col-md-4 col-form-label">Altura (cm)</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.height} id="height"  /> </div> </div>

	<div class="form-group row"><label for="weight" class="col-md-4 col-form-label">Peso (kg)</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.weight} id="weight"  /> </div> </div>

	<div class="form-group row"><label for="experience" class="col-md-4 col-form-label">Experiencia comprobada (años)</label><div class="col-md-8"><input class="form-control " type="number" bind:value={values.experience} id="experience"  /> </div> </div>

	</div>
	<div class="tab-pane" id="address-tab" role="tabpanel">
	<div class="form-group row"><label for="address_zip" class="col-md-4 col-form-label">Código Postal</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.address_zip} id="address_zip"  /> </div> </div>

	<div class="form-group row"><label for="address_block" class="col-md-4 col-form-label">Colonia</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.address_block} id="address_block"  /> </div> </div>

	<div class="form-group row"><label for="address_street" class="col-md-4 col-form-label">Calle y número</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.address_street} id="address_street"  /> </div> </div>

	<div class="form-group row"><label for="address_contry" class="col-md-4 col-form-label">País</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.address_contry} id="address_contry"  /> </div> </div>

	<div class="form-group row"><label for="address_city" class="col-md-4 col-form-label">Ciudad</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.address_city} id="address_city"  /> </div> </div>

	</div>
	<div class="tab-pane" id="contact-tab" role="tabpanel">
	<div class="form-group row"><label for="contact_name" class="col-md-4 col-form-label">Nombre</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.contact_name} id="contact_name"  /> </div> </div>

	<div class="form-group row"><label for="contact_relation" class="col-md-4 col-form-label">Parentesco</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.contact_relation} id="contact_relation"  /> </div> </div>

	<div class="form-group row"><label for="contact_email" class="col-md-4 col-form-label">Email</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.contact_email} id="contact_email"  /> </div> </div>

	<div class="form-group row"><label for="contact_phone" class="col-md-4 col-form-label">Teléfono fijo</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.contact_phone} id="contact_phone"  /> </div> </div>

	<div class="form-group row"><label for="contact_cel" class="col-md-4 col-form-label">Celular</label><div class="col-md-8"><input class="form-control " type="text" bind:value={values.contact_cel} id="contact_cel"  /> </div> </div>

	</div>
	</div>
</div>
	</div>
	</div>

  </div>
</form>
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-body">
          
          <button
            on:click={updateData}
            class="btn btn-primary waves-effect waves-light"
            disabled={loading}> {#if loading}<i class="bx bx-loader bx-spin font-size-16 align-middle mr-2"></i>{/if}
            Guardar</button>
          {#if loading}
            <div class="spinner-grow text-secondary m-1" role="status">
              <span class="sr-only">Guardando...</span>
            </div>
          {/if}
          <button
            on:click={cancel}
            class="btn btn-light waves-effect waves-light"
            disabled={loading}>
            Cancelar</button>
          
        </div>
      </div>
    </div>
    <!-- end col -->
  </div>
  <!-- end row -->
</div>