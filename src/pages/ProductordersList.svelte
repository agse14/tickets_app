<script>
    import { link } from "svelte-spa-router";
    import TitleBar from "../TitleBar.svelte";
    import { onMount, onDestroy, tick } from "svelte";
    import { push, pop, replace } from "svelte-spa-router";
    import FilterName from "../controls/FilterName.svelte";
    import { routes } from "../menu";
    import { store } from "../controls/products";
    import { products } from "../controls/products.js";
    import ProductsSearchList from "../controls/ProductsSearchList.svelte";
    import BranchesSearchList from "../controls/BranchesSearchList.svelte";
    import { fun } from "../callable";

    //variable para searchlist
    let branchProduct = null;

    // prueba monitoreo filtro
    $: branchProduct, getLastOrder();

    export let params = {};
    export let productType = undefined;
    let notes = "";
    let lastDate = "";
    let productorders = [];
    let datatable;
    let unsubscribe;
    let hasOrder = false;
    let start = DateTime.local().startOf("week");
    let end = DateTime.local().endOf("week");
    //store.push("Otros");
    if (DateTime.local().weekday < 3) {
        start = DateTime.local().startOf("week").minus({ days: 6 });
        end = DateTime.local().endOf("week").minus({ days: 6 });
    }
    console.log("filtered by", DateTime.local().weekday, start, end);

    let filterName = params.field;
    let filterValue = params.value;

    const hasAdd =
        Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/addproductorders") === 0;
        }).length > 0;
    const hasEdit =
        Object.keys(routes).filter(function (propertyName) {
            return propertyName.indexOf("/editproductorders/") === 0;
        }).length > 0;

    onMount(() => {});
    onDestroy(() => {
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
        }
    });
    function loadData() {
        datatable = jQuery("#datatable-buttons").DataTable({
            lengthChange: false,
            buttons: ["copy", "excel", "pdf"],
        });

        datatable
            .buttons()
            .container()
            .appendTo("#datatable-buttons_wrapper .col-md-6:eq(0)");
    }

    // let query = db.collection("productorders");
    // if(filterName != undefined && filterValue != undefined){
    //     console.log("filter : "+filterName+" == "+filterValue)
    //     query = query.where(filterName,"==",filterValue);
    // }
    // if(productType != undefined){
    //     query = query.where("type","==",productType);
    // }
    // unsubscribe = query.where('deliver',"==",false).where('added',">",start.toJSDate()).where('added',"<",end.toJSDate()).orderBy('added','desc').onSnapshot(async (querySnapshot) => {
    //     const tmp = [];

    //     querySnapshot.forEach((doc) => {
    //         // console.log(`${doc.id} => ${doc.data()}`);
    //         const tempproductorders = doc.data();
    //         tempproductorders.id = doc.id;
    //         tmp.push(tempproductorders);

    //     });
    //     productorders = tmp;
    //     console.log(productorders);
    //     /*await tick();
    //     if(datatable == undefined){

    //         loadData();
    //     }else{
    //         datatable.clear();
    //     }

    //     datatable.rows('dom').invalidate();*/
    // });

    function getLastOrder() {
        if (unsubscribe != null && unsubscribe != undefined) {
            unsubscribe();
        }
        notes = "";
        lastDate = "";
        hasOrder = false;
        if (branchProduct != null) {
            db.collection("pastinventory")
                .where("branches", "==", branchProduct)
                .orderBy("added", "desc")
                .limit(1)
                .get()
                .then(async function (res) {
                    console.log("got inventory", res);
                    if (!res.empty) {
                        console.log(res.docs[0].data());
                        // console.log(res.docs[1].data());
                        lastDate = res.docs[0].data().dayId;
                        if (
                            res.docs[0].data().notes != undefined &&
                            res.docs[0].data().notes != ""
                        ) {
                            notes = res.docs[0].data().notes;
                        }
                        let order = [];
                        let inv = await db
                            .collection("inventory")
                            .where("branches", "==", branchProduct)
                            .get();
                        console.log("got base", inv.docs);

                        for (var [key, value] of Object.entries(
                            res.docs[0].data()
                        )) {
                            // if(key == "ordY79Sb8NtxoE7wuhTG"){
                            //     console.log("jamon",key + ' ' + value); // "a 5", "b 7", "c 9"
                            // }
                            let toOrder = 0;
                            for (
                                let index = 0;
                                index < inv.docs.length;
                                index++
                            ) {
                                const element = inv.docs[index].data();
                                if (element.products == key) {
                                    // if(element.products == "ordY79Sb8NtxoE7wuhTG"){
                                    //     console.log("jamon",element); // "a 5", "b 7", "c 9"
                                    // }
                                    toOrder = element.quantity - value;
                                }
                            }
                            for (var prod of $products) {
                                if (prod.id == key) {
                                    if (toOrder > 0) {
                                        let tmpInv = {};
                                        tmpInv.store = prod.store;
                                        tmpInv.unit = prod.unit;
                                        tmpInv.cost = prod.cost ?? 0;
                                        tmpInv.branches = branchProduct;
                                        tmpInv.dayId = lastDate;
                                        tmpInv.deliver = false;
                                        tmpInv.products = key;
                                        tmpInv.quantity = toOrder;

                                        if (prod.type == undefined) {
                                            tmpInv.type = 0;
                                        } else {
                                            tmpInv.type = prod.type;
                                        }
                                        order.push(tmpInv);
                                    }
                                }
                            }
                        }
                        //console.log("order",order);
                        if (order.length > 0) {
                            hasOrder = true;
                            productorders = order;
                        }
                        productorders.forEach((order) => {
                            if (order.branches == branchProduct) {
                                hasOrder = true;
                            }
                        });
                        // if(!hasOrder){
                        //     db.collection("productorders").where('branches',"==",branchProduct).where('dayId',"==",lastDate).get().then(function(res){
                        //         const tmp = [];

                        //         res.forEach((doc) => {
                        //             // console.log(`${doc.id} => ${doc.data()}`);
                        //             const tempproductorders = doc.data();
                        //             tempproductorders.id = doc.id;
                        //             tmp.push(tempproductorders);

                        //         });

                        //         productorders = [...productorders,...tmp];
                        //     });
                        // }
                    }
                });
        }
    }

    function deleteDoc(id) {
        Swal.fire({
            title: "¿Esta seguro?",
            text: "Desea eliminar este registro",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#34c38f",
            cancelButtonColor: "#f46a6a",
            confirmButtonText: "Si, borrarlo!",
        }).then(function (result) {
            if (result.value) {
                db.collection("productorders").doc(id).delete();
                //Swal.fire("Deleted!", "Your file has been deleted.", "success");
            }
        });
    }

    function asyncChange(id, field, newval) {
        var update = {};
        update[field] = newval;
        db.collection("productorders").doc(id).update(update);
    }
    function selectElementContents(elId) {
        var el = document.getElementById(elId);
        var body = document.body,
            range,
            sel;
        if (document.createRange && window.getSelection) {
            range = document.createRange();
            sel = window.getSelection();
            sel.removeAllRanges();
            try {
                range.selectNodeContents(el);
                sel.addRange(range);
            } catch (e) {
                range.selectNode(el);
                sel.addRange(range);
            }
            document.execCommand("copy");
            //range.execCommand("Copy");
        } else if (body.createTextRange) {
            range = body.createTextRange();
            range.moveToElementText(el);
            range.select();
            range.execCommand("Copy");
        }
    }
</script>

<div class="page-content">
    <TitleBar title="Lista de compras" base="Inventario" />
    <div class="">
        <p>
            <BranchesSearchList bind:value={branchProduct} />
        </p>
    </div>
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <h4 class="card-title">Lista de compras</h4>
                    {#if filterName != undefined && filterValue != undefined}
                        <FilterName node={filterName} value={filterValue} />
                    {/if}
                    <div class="row">
                        <div class="col">
                            Día pedido: {lastDate}
                            {#if !hasOrder && branchProduct != undefined}viendo
                                el último pedido, <br />{/if}<br />
                            {#if notes != ""}Notas del Chef: <b>{notes}</b>{/if}
                        </div>

                        <div class="col-md-auto align-self-end">
                            <button
                                on:click={function () {
                                    window.print();
                                }}
                                class="btn btn-primary waves-effect waves-light"
                                ><i
                                    class="bx bx-printer font-size-16 align-middle"
                                /> Imprimir</button
                            >
                        </div>
                    </div>
                    {#each store as name, s}
                        <h3>
                            {name}
                            <button
                                on:click={function () {
                                    selectElementContents("datatable-" + s);
                                }}
                                class="btn btn-light btn-sm waves-effect waves-light"
                                ><i
                                    class="bx bx-copy font-size-16 align-middle"
                                /> Copiar</button
                            >
                        </h3>
                        <table
                            id="datatable-{s}"
                            class="table table-striped table-bordered dt-responsive nowrap"
                            style="border-collapse: collapse; border-spacing: 0; width: 100%;"
                        >
                            <thead>
                                <tr>
                                    <th>Sucursal</th>

                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Entregado</th>
                                    <th class="no-print">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {#each productorders as row}
                                    {#if row.branches == branchProduct}
                                        {#if row.store == name || (name == "Otros" && row.store == undefined)}
                                            <tr>
                                                <td
                                                    ><BranchesSearchList
                                                        value={row.branches}
                                                        inlist={true}
                                                    /></td
                                                >

                                                <td
                                                    ><ProductsSearchList
                                                        value={row.products}
                                                        inlist={true}
                                                    /></td
                                                >
                                                <td
                                                    >{row.quantity}
                                                    {row.unit}</td
                                                >
                                                <td>
                                                    
                                                    <div
                                                        class="custom-control custom-switch mb-2 no-print"
                                                        dir="ltr"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            class="custom-control-input"
                                                            id="deliverSwitch{row.id}"
                                                            checked={row.deliver}
                                                            on:change={(e) => {
                                                                asyncChange(
                                                                    row.id,
                                                                    "deliver",
                                                                    e.target
                                                                        .checked
                                                                );
                                                            }}
                                                        />
                                                        <label
                                                            class="custom-control-label"
                                                            for="deliverSwitch{row.id}"
                                                        />
                                                    </div>
                                                </td>
                                                <td class="no-print">
                                                    {#if hasEdit}
                                                        <a
                                                            href="/editproductorders/{row.id}"
                                                            use:link
                                                            class="btn btn-light waves-effect"
                                                            ><i
                                                                class="bx bx-edit-alt font-size-16 align-middle"
                                                            /></a
                                                        >
                                                    {/if}
                                                    <button
                                                        on:click={() => {
                                                            deleteDoc(row.id);
                                                        }}
                                                        class="btn btn-danger waves-effect waves-light"
                                                        ><i
                                                            class="bx bx-x font-size-16 align-middle"
                                                        /></button
                                                    ></td
                                                >
                                            </tr>
                                        {/if}
                                    {/if}
                                {/each}
                            </tbody>
                        </table>

                        <!-- end store -->
                    {/each}
                </div>
            </div>
        </div>
        <!-- end col -->
    </div>
    <!-- end row -->
</div>
