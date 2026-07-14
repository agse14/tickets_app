import { readable } from 'svelte/store';

var unsub;
export const billing_period = ["Mensual", "Quincenal"];
export const medical_service = ["IMSS", "ISSSTE"];
export const status = ["Activo", "Baja Temporal", "Baja Permanente", "Separación"];
export const staytype = ["Permanente", "Temporal"];


export const patients = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("patients").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const temppatients = doc.data();
                temppatients.id = doc.id;
                temppatients.billing_periodId = doc.data().billing_period;
temppatients.billing_period = billing_period[doc.data().billing_period];
temppatients.medical_serviceId = doc.data().medical_service;
temppatients.medical_service = medical_service[doc.data().medical_service];
temppatients.statusId = doc.data().status;
temppatients.status = status[doc.data().status];
temppatients.staytypeId = doc.data().staytype;
temppatients.staytype = staytype[doc.data().staytype];

                tmp.push(temppatients);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading patients", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addPatients = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("patients").doc();
    docRef.set(values);
    return docRef.id;
}