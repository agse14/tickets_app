import { readable } from 'svelte/store';

var unsub;


export const drug_inventory = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("drug_inventory").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempdrug_inventory = doc.data();
                tempdrug_inventory.id = doc.id;
                
                tmp.push(tempdrug_inventory);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading drug_inventory", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addDrug_inventory = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("drug_inventory").doc();
    docRef.set(values);
    return docRef.id;
}