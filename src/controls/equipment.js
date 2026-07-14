import { readable } from 'svelte/store';

var unsub;
export const status = ["Activo", "Inactivo", "En Reparaci\u00f3n"];
export const capacity = ["5 Litros", "10 Litros"];


export const equipment = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("equipment").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempequipment = doc.data();
                tempequipment.id = doc.id;
                tempequipment.status = status[doc.data().status];
tempequipment.capacity = capacity[doc.data().capacity];

                tmp.push(tempequipment);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading equipment", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});