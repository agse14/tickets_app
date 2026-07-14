<script>

export let email;
export let password;

let passkey = true;

var errorlog = "";
var errormail = "";

let response = "";

function login() {
try{
  console.log('Firebase app options:', firebase.app().options);
  console.log('Firebase current user before signIn:', firebase.auth().currentUser);
  firebase.auth().signInWithEmailAndPassword(email, password).catch(function(err) {
  // Handle Errors here.
  console.log("Err",err);
  var errorCode = "";
  if(IsJsonString(err.message)){
    errorCode = JSON.parse(err.message).error.message;
  }else{
    errorCode = err.message;
  }
  errorlog = "Error al iniciar sesión ." +errorCode;
  console.log("Wrong email or password",errorCode);
  
  // ...
  
});


}catch(err){
    //error = "Error al iniciar sesión ." +err.message;
}

}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function forgotpass() {
   
    if(passkey == true) {
        passkey = false;
    }
    else if (passkey == false) {
        passkey = true;
    }

}

function sendpass() {

    firebase.auth().sendPasswordResetEmail(email).then(function() {
  // Email sent.
        response = "Contraseña enviada con éxito";
  
}).catch(function(err) {
  // Handle Errors here.
  console.log("Err",err);
  var errorCode = "";
  if(IsJsonString(err.message)){
    errorCode = JSON.parse(err.message).error.message;
  }else{
    errorCode = err.message;
  }
  errormail = "Error al enviar correo ." +errorCode;
  console.log("Wrong email or password",errorCode);
  
  // ...
 
});

}

</script>


<main>
<div class="home-btn d-none d-sm-block">
  <a href="index.html" class="text-dark"><i class="fas fa-home h2"></i></a>
</div>
<div class="account-pages my-5 pt-sm-5">
  <div class="container">
      <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6 col-xl-5">
              <div class="card overflow-hidden">
                  <div class="bg-login text-center">
                      <div class="bg-login-overlay"></div>
                      <div class="position-relative">
                          <h5 class="text-white font-size-20">Bienvenido</h5>
                          <p class="text-white-50 mb-0">Ingresa tus datos para continuar...</p>
                          <a href="index.html" class="logo logo-admin mt-4">
                              <img src="assets/images/logo-sm.png" alt="" height="30">
                          </a>
                      </div>
                  </div>
                  <div class="card-body pt-5">
                      <div class="p-2">
                          
                                {#if passkey == true}
                                <div class="form-horizontal" >
                              <div class="form-group">
                                  <label for="username">Correo</label>
                                  <input type="email" class="form-control" id="username" placeholder="Escribir correo..." bind:value={email}>
                              </div>

                              <div class="form-group">
                                  <label for="userpassword">Contraseña</label>
                                  <input type="password" class="form-control" id="userpassword" placeholder="Escribir contraseña..." bind:value={password}>
                              </div>

                              <div class="custom-control custom-checkbox">
                                  <input type="checkbox" class="custom-control-input" id="customControlInline">
                                  <label class="custom-control-label" for="customControlInline">Recordarme</label>
                              </div>
                              <div class="text-danger">{errorlog}</div>
                              <div class="mt-3">
                                  <button class="btn btn-primary btn-block waves-effect waves-light"  on:click={login}>Ingresar</button>
                                  
                              </div>

                              <div class="mt-4 text-center">
                                <button on:click={()=>{forgotpass()}} class="btn btn-primary btn-block waves-effect waves-light"><i class="mdi mdi-lock mr-1"></i> ¿Olvidaste tu contraseña?</button>
                                
                            </div>
                            </div>
                              {:else if passkey == false}
                              <div class="form-horizontal" >
                                <div class="form-group">
                                    <label for="username">Correo electrónico</label>
                                    <input type="email" class="form-control" id="username" placeholder="Escribir correo electrónico..." bind:value={email}>
                                    <div class="text-success">{response}</div>
                                    <div class="text-danger">{errormail}</div>
                                </div>
                            </div>

                            <div>
                                <button on:click={()=>{sendpass()}}
        
        class="btn btn-primary waves-effect waves-light"
        > 
        Envíar</button>
      
      <button  on:click={()=>{forgotpass()}}
        
        class="btn btn-light waves-effect waves-light"
        >
        Cancelar</button>

        

                            </div>
                            {/if}



                            

                              
                                
                            </div>
                          
                      
                  </div>
              </div>
              <div class="mt-5 text-center">
                  <!--<p>¿No tienes cuenta? <a href="pages-register.html" class="font-weight-medium text-primary"> Darse de alta </a> </p>-->
                  <p>© 2021 by Ingenoid.es </p>
              </div>

          </div>
      </div>
  </div>
</div>
</main>