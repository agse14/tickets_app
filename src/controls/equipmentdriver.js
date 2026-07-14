import { readable } from 'svelte/store';

var unsub;


export const equipmentdriver = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("equipmentdriver").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempequipmentdriver = doc.data();
                tempequipmentdriver.id = doc.id;
                
                tmp.push(tempequipmentdriver);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading equipmentdriver", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});