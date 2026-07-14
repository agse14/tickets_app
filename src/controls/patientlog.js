import { readable } from 'svelte/store';

var unsub;
export const detail = ["Anticipo", "Ajuste de sueldo", "Anticipo N\u00f3mina Tarjeta", "Bono", "Deducci\u00f3n de uniforme", "Deducciones", "Complemento de n\u00f3mina", "Horas extras", "Incapacidad", "Infonavit", "Pago de mas", "Pr\u00e9stamo", "Vacaciones", "D\u00eda festivo", "Pensi\u00f3n alimenticia", "IMSS", "Retardos", "Apoyo Covid", "Otros +", "Otros -", "PTU", "Recomienda y Gana", "Aguinaldo", "Apoyo a Enfermedad (+)", "Comisión Depósito", "Faltas", "Vacaciones Tomadas(+)", "Finiquito",];
export const type = ["Normal", "Extra"];


export const patientlog = readable([], function start(set) {
    if (unsub == undefined) {
        unsub = db.collection("patientlog").orderBy('added', 'desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];

            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const temppatientlog = doc.data();
                temppatientlog.id = doc.id;
                temppatientlog.detailId = doc.data().detail;
                temppatientlog.detail = detail[doc.data().detail];
                temppatientlog.typeId = doc.data().type;
                temppatientlog.type = type[doc.data().type];

                tmp.push(temppatientlog);

            });
            set(tmp);


        }, function (error) {
            console.log("Error loading patientlog", error);
        });
    }
    return function stop() {
        //unsub();
        //unsub == undefined;
    };
});

export const addPatientlog = async (values) => {
    values.added = timenow;
    const docRef = await db.collection("patientlog").doc();
    docRef.set(values);
    return docRef.id;
}