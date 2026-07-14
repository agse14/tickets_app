<script>
        import TitleBar from "../TitleBar.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
import { onMount } from "svelte";
import {steps, getIcon, getLabel} from '../controls/supervision_cats.js';

    export let params = {};
    let branch = "";
    if(params.bid != undefined){
        branch = params.bid;
    }
    let qr =[];
    let qrr =[];
    let rooms =[];
    let url = "sistema.losolivosestancias.com.mx/#/addsupervision/";
    $: branch, createQRs();

    async function loadRooms(){
        //console.log("data",branch);
        if(branch == 'all'){
            return;
        }
        var roomData = await db.collection("room_inventory").where("branches","==",branch).orderBy("name").get();
        rooms = [];
        roomData.docs.forEach(element => {
            var el = element.data();
            el.id = element.id;
            rooms.push(el);
        });
        rooms = rooms;
    }

    async function createQRs(){
        if(branch == 'all'){
            return;
        }
        await loadRooms();
        
        for (let index = 0; index < 8; index++) {
            if(qr[index] != undefined){
                const element = qr[index];
                element.clear(); 
                element.makeCode("olivos:"+branch+","+index);
            }else{
                let elem = document.getElementById("qrcode"+index);
                if(elem != undefined){
                    qr.push(new QRCode(elem, "olivos:"+branch+","+index));
                }
            }
            
        }
        for (let index = 0; index < rooms.length; index++) {
            if(qrr[index] != undefined){
                const element = qrr[index];
                element.clear(); 
                element.makeCode("olivos:"+branch+",3,"+rooms[index].name);
            }else{
                let elem = document.getElementById("qrcode3_"+index);
                if(elem != undefined){
                    qrr.push(new QRCode(elem, "olivos:"+branch+",3,"+rooms[index].name));
                }
            }
            
        }
        
        
    }
    onMount(()=>{
        createQRs();
    });
</script>

<div class="page-content">
    
    
    
    
       
<div class="">
    <TitleBar title="Codigos QR " base="Estancias" />
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h4 class="card-title">Imprimir codigos QR para <BranchesSearchList bind:value={branch} /> <button type="button" class="btn btn-primary" on:click={()=>{window.print();}}>Imprimir</button></h4>
                        <div class="row">
                            {#each Array(steps) as _, i}
                                <div class="col-4">
                                    <BranchesSearchList bind:value={branch} inlist={true} />
                                    <div id="qrcode{i}"></div>
                                    <h3><i class="mdi {getIcon(i)}"></i> {getLabel(i)}</h3>
                                </div>
                            {/each}
                        </div>
                        <div class="rowqr">
                            <div class="col-12"><hr /><h3>Cuartos</h3></div>
                            {#each rooms as room,i}
                                <div class="qrline">
                                    <BranchesSearchList bind:value={branch} inlist={true} />
                                    <div id="qrcode3_{i}"></div>
                                    <h3><i class="mdi {getIcon(3)}"></i> {getLabel(3)} : {room.name}</h3>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row"><div class="col-12">
            <h3>Areas</h3>
            {#each Array(steps) as _, i}
                <p>{url}branches/{branch}/step/{i}</p>
            {/each}
            <h3>Cuartos</h3>
            {#each rooms as room,i}
                <p>{url}branches/{branch}/step/3/room/{room.name}</p>
            {/each}
        </div></div>
        
            
</div> 
</div>
<style>
@media print {
  .col-4, .qrline {
    break-inside: avoid;
    page-break-inside:avoid;
  }

}

.rowqr {
    display: block;
  }
  .qrline {
    display: block;
    float: left;
    width: 32%;
  }
</style>
