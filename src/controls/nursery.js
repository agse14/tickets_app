import { readable } from 'svelte/store';

var unsub;


export const nursery = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("nursery").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempnursery = doc.data();
                tempnursery.id = doc.id;
                
                tmp.push(tempnursery);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading nursery", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addNursery = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("nursery").doc();
    docRef.set(values);
    return docRef.id;
}