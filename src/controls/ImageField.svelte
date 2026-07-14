<script>
export let nodeId = "";
export let value = "";
export let type = "img";
export let baseId = "";
const c = Math.PI*(90*2);
let percentage = 1*c;
let loading = false;
let file;



      const onFile = event => {
        //console.log(event)
        //const files = getFilesFunction(event);
        /*if (files.length) {
        dispatch("input", { files: multiple ? files : files[0] });
        }*/
        
        console.log(event.target);
	    const file = event.target.files[0];
	    if(file == undefined){
	    	/*this.setState({
	        [name]: ''
	      });*/
	    	return;
        }
        //loading = true;
	    var partnersId = nodeId;
	    if(partnersId == undefined){
            //partnersId = this.state.tmpId;
            return;
        }
        loading = true;
	    const storageRef = storage.child("parter_web/"+partnersId+"/"+file.name);
	    const task = storageRef.put(file);

	    task.on('state_changed', (snapshot) => {
	      percentage = (1 - (snapshot.bytesTransferred / snapshot.totalBytes) )*c;
	      
	    }, (error) => {
          console.error(error.message);
          loading = false;
	    }, () => {
	      // Upload complete
	      task.snapshot.ref.getDownloadURL().then(function(downloadURL) {
		    console.log('File available at', downloadURL);
            value = downloadURL;
            loading = false;
		  });
	      

	    });
    };
</script>
<style>
.selector{
  border:solid 2px #eaeaea;
  padding: 10px;
  border-radius:10px;
}
.container{
  position:relative;
}
.mdi{
  font-size:25px;
}
#progress {
  position:absolute;
  left:0; top:0; width:100%; height:100%
}
#progress circle {
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 1s linear;
  stroke: #666;
  stroke-width: 1em;
}
#progress #bar {
  stroke: #FF9F1E;
}

</style>
<div class="text-center">
        <label class="" for="customFile{baseId}">
      {#if value == "" || value == undefined}
      <div class="row selector">
        <div class="col-6"><div class="avatar-md img-thumbnail rounded-circle">
            <span class="avatar-title  rounded-circle container">
            <svg id="progress" viewPort="0 0 100 100" preserveAspectRatio="none" viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <circle r="90" cx="100" cy="100" fill="transparent" stroke-dasharray="565.48" stroke-dashoffset="0"></circle>
  <circle id="bar" r="90" cx="100" cy="100" fill="transparent" stroke-dasharray="565.48" style="stroke-dashoffset:{percentage}px"></circle>
</svg>
              <i class="mdi {type =="img"?"mdi-camera-plus-outline":"mdi mdi-file-plus-outline"}"></i>
                </span>
                
          </div></div>
        <div class="col-6 d-table-cell align-middle">
        <i class="mdi mdi-arrow-up-bold-box-outline"></i><br />

        Seleccionar Archivo</div>
      </div>
          
          
      {:else}
          <div class="row selector">
            <div class="col-6"><img src={value} alt="" class="avatar-lg img-thumbnail rounded-circle"></div>
            <div class="col-6 align-middle"><i class="mdi mdi-arrow-up-bold-box-outline"></i><br />Cambiar Archivo</div>
          </div>
          
      {/if} 
          </label>
      <div class="col-lg-6 d-none">
        <div class="custom-file">
          <input type="file" on:input={onFile}  class="custom-file-input" id="customFile{baseId}" disabled={loading} />
          
      </div>
        <!--<input type="file" class="btn btn-primary waves-effect waves-light col-12" />
        <div class="online-circle"><i class="fas fa-circle text-success"></i></div>-->
    </div>
</div>
