import { readable } from 'svelte/store';

var unsub;


export const equipmentsalesmen = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("equipmentsalesmen").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempequipmentsalesmen = doc.data();
                tempequipmentsalesmen.id = doc.id;
                
                tmp.push(tempequipmentsalesmen);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading equipmentsalesmen", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});