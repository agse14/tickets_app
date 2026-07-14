import { readable } from 'svelte/store';

var unsub;


export const activities = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("activities").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempactivities = doc.data();
                tempactivities.id = doc.id;
                
                tmp.push(tempactivities);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading activities", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addActivities = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("activities").doc();
    docRef.set(values);
    return docRef.id;
}