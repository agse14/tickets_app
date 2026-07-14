import { readable } from 'svelte/store';

var unsub;


export const cardActivities = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("cardActivities").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempcardActivities = doc.data();
                tempcardActivities.id = doc.id;
                
                tmp.push(tempcardActivities);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading cardActivities", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addCardactivities = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("cardActivities").doc();
    docRef.set(values);
    return docRef.id;
}