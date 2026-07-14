<script>
    export let total=0;
    export let completed = 0;
    export let hour = "";

    
    // let checksMap = {};
    // let total = 0;
    // let completed = 0;
    // tags = tags.sort((a,b)=>{
    //         if(a.order < b.order) { return -1; }
    //         if(a.order > b.order) { return 1; }
    //         return 0;
    //     });

    // $: checks, processChecks();

    // function processChecks() {
    //     checksMap = {};
    //     checks.forEach(check=>{
    //         checksMap[check.supervision_tags] = true;
    //     });
    //     // console.log("checks",checksMap, checks);
    //     total = tags.length;
    //     completed = 0;
    //     for(let i=0; i<tags.length; i++){
    //         if(checksMap[tags[i].id]){
    //             completed++;
    //         }
    //     }
        
    // }
</script>

<div class="tags">
    <div class="completed">
        <div class=" pie" style="--p:{(completed/total*100).toFixed(0)};--b:10px;--c:{completed/total > 0.90?'green':completed == 0?'red':'yellow'};">
            <h5>{hour}</h5>
            <p class="percentage {completed ==0?'error':''}">{(completed/total*100).toFixed(1)}%</p>
            {completed}/{total}
        </div>
        
        
    </div>
</div>
<style>
    .pie {
        width: 150px;
        aspect-ratio: 1;
        display: inline-grid;
        place-content: center;
        margin: 5px;
        position: relative;
        font-size: 10px;
        text-align: center;
        /* font-family: sans-serif; */
        }
        .error{
            color: red;
        }
    .percentage{
        font-size: 30px;
        font-weight: bold;
        margin: 0;
    }
    .pie:before{
    content: "";
    position: absolute;
    border-radius: 50%;
    inset: 0;
    background: conic-gradient(var(--c) calc(var(--p)*1%),#0000 0);
    -webkit-mask:radial-gradient(farthest-side,#0000 calc(99% - var(--b)),#000 calc(100% - var(--b)));
          mask:radial-gradient(farthest-side,#0000 calc(99% - var(--b)),#000 calc(100% - var(--b)));
    }
    h5{
        font-size: 9px;
        margin: 0;
    }
    .tags{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
    }
    .tag{
        background-color: #e0e0e0;
        padding: 5px;
        margin: 5px;
        border-radius: 5px;
        font-size: 10px;
    }
    .check{
        background-color: #4caf50;
        color: white;
    }
</style>