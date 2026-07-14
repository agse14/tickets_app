import { readable } from 'svelte/store';

var unsub;


export const positions = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("positions").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const temppositions = doc.data();
                temppositions.id = doc.id;
                
                tmp.push(temppositions);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading positions", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addPositions = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("positions").doc();
    docRef.set(values);
    return docRef.id;
}