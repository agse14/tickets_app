<script>
    import { link } from "svelte-spa-router";
    export let label="";
    export let number="";
    export let url="";
    export let warning = true;
</script>
<div class="card">
    <div class="card-body">
        <div class="media">
            <!-- <div class="avatar-md font-size-20 mr-3">
                <! -- <a href={url} use:link class="btn btn-secondary waves-effect">Ver</a>
                <span class="avatar-title bg-soft-primary text-primary rounded">
                        <i class="mdi mdi-account-multiple-outline"></i>
                    </span> -- >
                    <! -- <span class="avatar-title bg-soft-primary text-primary rounded">
                        <i class="mdi mdi-account-multiple-outline"></i>
                    </span> -- >
            </div> -->
            <div class="media-body">
                <div class="font-size-16 text-center">
                    <h4 class="text-center">{number} {#if number > 0 && warning}<i class="text-warning mdi mdi-information"></i> {/if}</h4> 
                    {label}</div>
            </div>
        </div>
        
        <!-- <div class="row">
            <div class="col-12 align-self-center">
                
            </div>
        </div> -->
    </div>
</div>