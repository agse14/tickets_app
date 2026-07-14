import { readable } from 'svelte/store';

var unsub;


export const supervision_tags_check = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("supervision_tags_check").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempsupervision_tags_check = doc.data();
                tempsupervision_tags_check.id = doc.id;
                
                tmp.push(tempsupervision_tags_check);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading supervision_tags_check", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addSupervision_tags_check = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("supervision_tags_check").doc();
    docRef.set(values);
    return docRef.id;
}