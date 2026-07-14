<script>
    let bid = "";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import TitleBar from "../TitleBar.svelte";
    import { checklist, cleaningChecklist } from "../Utils/checks";
    let branch = {};

    $: bid, loadBranch();

    function loadBranch() {
        if (bid == "") {
            return;
        }
        db.collection("branches").doc(bid).get().then((doc) => {
            branch = doc.data();
        });
    }
</script>
<div class="page-content">
    <TitleBar title="Tarea" base="Inventario" />

    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h2 class="card-title">Estoy en la estancia</h2>
                    <div class="">
                        <p>
                            <BranchesSearchList bind:value={bid} inlist={false} />
                        </p>
                    </div>
                    <div class="row">
                        <div class="col-12">
                                {#each checklist as item}
                                    <p>supervision:{branch.sensor}={item.id}</p>
                                {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>