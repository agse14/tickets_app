import { readable } from 'svelte/store';

var unsub;
export const paymentperiod = ["Semanal", "Quincenal", "Especial", "Mantenimiento", "Banca", "Proyecto"];
export const payroll = ["Fijo", "Guardia"];
export const status = ["Activo", "Inactivo", "Baja"];


export const workers = readable([], function start(set) {
    if (unsub == undefined) {
        unsub = db.collection("workers").orderBy('added', 'desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];

            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempworkers = doc.data();
                tempworkers.id = doc.id;
                tempworkers.paymentperiodId = doc.data().paymentperiod;
                tempworkers.paymentperiod = paymentperiod[doc.data().paymentperiod];
                tempworkers.payrollId = doc.data().payroll;
                tempworkers.payroll = payroll[doc.data().payroll];
                tempworkers.statusId = doc.data().status;
                tempworkers.status = status[doc.data().status];

                tmp.push(tempworkers);

            });
            set(tmp);


        }, function (error) {
            console.log("Error loading workers", error);
        });
    }
    return function stop() {
        //unsub();
        //unsub == undefined;
    };
});

export const addWorkers = async (values) => {
    values.added = timenow;
    const docRef = await db.collection("workers").doc();
    docRef.set(values);
    return docRef.id;
}