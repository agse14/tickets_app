import { readable } from 'svelte/store';

var unsub;
export const dosis_unit = ["gel", "ml", "tabletas", "capsulas", "gotas", "ampolletas", "pluma", "nebulizaci\u00f3n", "piezas", "ung\u00fcento", "mg"];
export const frequency = ["D\u00edas", "Dosis", "Permanentemente", "por raz\u00f3n necesaria"];
export const operation = ["Nueva Prescripci\u00f3n", "Cambio en prescripci\u00f3n", "Se quit\u00f3 la prescipci\u00f3n"];
export const via = ["oral", "intravenoso", "otico", "oftalmica", "intramuscular", "subcutáneo"];


export const prescriptions_history = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("prescriptions_history").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempprescriptions_history = doc.data();
                tempprescriptions_history.id = doc.id;
                tempprescriptions_history.dosis_unitId = doc.data().dosis_unit;
tempprescriptions_history.dosis_unit = dosis_unit[doc.data().dosis_unit];
tempprescriptions_history.frequencyId = doc.data().frequency;
tempprescriptions_history.frequency = frequency[doc.data().frequency];
tempprescriptions_history.operationId = doc.data().operation;
tempprescriptions_history.operation = operation[doc.data().operation];
tempprescriptions_history.viaId = doc.data().via;
tempprescriptions_history.via = via[doc.data().via];

                tmp.push(tempprescriptions_history);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading prescriptions_history", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addPrescriptions_history = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("prescriptions_history").doc();
    docRef.set(values);
    return docRef.id;
}