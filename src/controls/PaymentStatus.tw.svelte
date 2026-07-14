<script>
    import { onDestroy } from "svelte";
    import {calculatePercent} from "../Utils/payments.js";

    export let patientId;

    let payments = [];
    let patient = {};
    let months = [];
    let loading = true;
    let unsubscribe;

    async function loadData(){
        let patientData = await db.collection("patients").doc(patientId).get();
        if(!patientData.exists){
            return;
        }
        patient = patientData.data();
        patient.id = patientData.id;
        patient = await calculatePercent(patient);
        let query = db.collection("patients").doc(patientId).collection("payments");
        unsubscribe = query
            .orderBy("added", "desc")
            .onSnapshot(async (querySnapshot) => {
                const tmp = [];
                querySnapshot.forEach((doc) => {
                    tmp.push({ id: doc.id, ...doc.data() });
                });
                payments = tmp;
                processPayments();
            });

            
    }

    function processPayments(){
        months = [];
        let tdini;      
        if (patient.addedDate > patient.fechapago) {
            tdini = patient.addedDate;//.startOf("month");
        } else {
            tdini = patient.fechapago;//.startOf("month");
        }
        const endDate = DateTime.local().plus({ months: 3 }); //.startOf("month")
        const monthsNum = endDate.diff(tdini, "months").months;
        for (let i = 0; i < monthsNum; i++) {
            const month = tdini.plus({ months: i });
            const monthId = month.startOf("month").toISODate();
            const monthEnd = month.plus({ months: 1 }).minus({ days: 1 });
            const hasMonth = patient.payments.find((p) => {
                for (let i = 0; i < p.concepts.length; i++) {
                    const c = p.concepts[i];
                    if (c.concept === 2 && c.monthId === monthId) {
                        return true;
                    }
                }
            });
            if (hasMonth) {
                if (month >= DateTime.local().startOf("month")) {
                    months.push({ month, monthEnd, status: "paid" });
                }
            } else {
                if (month < DateTime.local().startOf("month")) {
                    months.push({ month, monthEnd, status: "pending" });
                } else {

                    months.push({ month, monthEnd, status: "wait" });
                }
            }
        }
        loading = false;
            // console.log(months, tdini, endDate);
            // console.log(patient);
    }
    loadData();
    onDestroy(() => {
        unsubscribe();
    });


</script>
<div class="flex gap-2 overflow-x-auto">
{#each months as month}
<div class="flex flex-col gap-2 items-center text-center">
    Mes
    {#if month.status === "paid"}
    <div class="bg-green-100 text-green-600 shadow-md shadow-green-400 size-12 rounded-full text-xl flex items-center justify-center">
        <iconify-icon icon="mdi:check"></iconify-icon>
    </div>
    {:else if month.status === "pending"}
    <div class="bg-red-100 text-red-600 shadow-md shadow-red-400 size-12 rounded-full text-xl flex items-center justify-center">
        <iconify-icon icon="mdi:alert"></iconify-icon>
    </div>
    {:else }
    <div class="bg-gray-100 text-gray-600 shadow-md shadow-gray-400 size-12 rounded-full text-xl flex items-center justify-center">
        <iconify-icon icon="mdi:minus"></iconify-icon>
    </div>
    {/if}
    {month.month.toLocaleString({ day:"numeric", month: "short" })} -
    {month.monthEnd.toLocaleString({ day:"numeric", month: "short" })}
    {month.month.year}
</div> 
{/each}
</div>
<svelte:head>
    <link href="assets/css/output.css" rel="stylesheet" />
</svelte:head>