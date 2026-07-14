<script>
    export let tags=[];
    export let checks = [];
    export let hour = "";

    
    let checksMap = {};
    tags = tags.sort((a,b)=>{
            if(a.order < b.order) { return -1; }
            if(a.order > b.order) { return 1; }
            return 0;
        });

    $: checks, processChecks();

    function processChecks() {
        checks.forEach(check=>{
            checksMap[check.supervision_tags] = true;
        });
        // console.log("checks",checksMap, checks);
        
    }
</script>
<h5>{hour}</h5>
<div class="tags">
    {#each tags as tag}
        <div class="tag {checksMap[tag.id] ? 'check':''}">
            {#if checksMap[tag.id]}
                <i class="fas fa-check"></i>
            {:else}
                <i class="fas fa-times"></i>
            {/if}
            
            {tag.location}
        </div>
    {/each}
</div>
<style>
    .tags{
        display: flex;
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