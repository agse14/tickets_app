import { readable } from 'svelte/store';

var unsub;


export const users = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("users").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempusers = doc.data();
                tempusers.id = doc.id;
                
                tmp.push(tempusers);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading users", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addUsers = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("users").doc();
    docRef.set(values);
    return docRef.id;
}