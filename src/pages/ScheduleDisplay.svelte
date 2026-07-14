<script>
    import TitleBar from "../TitleBar.svelte";
    import ListSelect from "../ListSelect.svelte";
    import WorkersSearchList from "../controls/WorkersSearchList.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import {link} from 'svelte-spa-router';
    import ScheduleLog from "./ScheduleLog.svelte";

let product = null;

    
    
    </script>
    
    <div class="page-content">
    
        <TitleBar title="Caledario " base="Horarios" />
        
        
        <div class="">
            <p>
                <BranchesSearchList bind:value={product} /></p>
                
                
    </div>    
    {#if product != null}
        <div class="row">
            <div class="col-12">
                <ScheduleLog bid={product} /> 
            </div>
        </div>
    {:else}
        <p></p>
        
    {/if}
</div>
