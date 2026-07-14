import { readable } from 'svelte/store';

var unsub;
export const status = ["Activa", "Inactiva"];


export const supervision_tags = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("supervision_tags").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempsupervision_tags = doc.data();
                tempsupervision_tags.id = doc.id;
                tempsupervision_tags.statusId = doc.data().status;
tempsupervision_tags.status = status[doc.data().status];

                tmp.push(tempsupervision_tags);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading supervision_tags", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addSupervision_tags = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("supervision_tags").doc();
    docRef.set(values);
    return docRef.id;
}