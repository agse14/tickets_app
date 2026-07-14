import { readable } from 'svelte/store';

var unsub;
export const dosis_unit = ["gel", "ml", "tabletas", "capsulas", "gotas", "ampolletas", "pluma", "nebulizaci\u00f3n", "piezas", "ung\u00fcento", "mg"];
export const frequency = ["D\u00edas", "Dosis", "Permanentemente", "por raz\u00f3n necesaria"];
export const via = ["oral", "intravenoso", "otico", "oftalmica", "intramuscular", "subcutáneo"];


export const prescriptions = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("prescriptions").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempprescriptions = doc.data();
                tempprescriptions.id = doc.id;
                tempprescriptions.dosis_unitId = doc.data().dosis_unit;
tempprescriptions.dosis_unit = dosis_unit[doc.data().dosis_unit];
tempprescriptions.frequencyId = doc.data().frequency;
tempprescriptions.frequency = frequency[doc.data().frequency];
tempprescriptions.viaId = doc.data().via;
tempprescriptions.via = via[doc.data().via];

                tmp.push(tempprescriptions);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading prescriptions", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addPrescriptions = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("prescriptions").doc();
    docRef.set(values);
    return docRef.id;
}