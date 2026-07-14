import { readable } from 'svelte/store';

var unsub;
export const status = ["Nuevo", "En Revision", "Completado"];


export const supervision_obs = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("supervision_obs").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempsupervision_obs = doc.data();
                tempsupervision_obs.id = doc.id;
                tempsupervision_obs.statusId = doc.data().status;
tempsupervision_obs.status = status[doc.data().status];

                tmp.push(tempsupervision_obs);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading supervision_obs", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addSupervision_obs = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("supervision_obs").doc();
    docRef.set(values);
    return docRef.id;
}