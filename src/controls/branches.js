import { readable } from 'svelte/store';

var unsub;


export const branches = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("branches").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempbranches = doc.data();
                tempbranches.id = doc.id;
                
                tmp.push(tempbranches);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading branches", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addBranches = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("branches").doc();
    docRef.set(values);
    return docRef.id;
}