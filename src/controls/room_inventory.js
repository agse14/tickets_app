import { readable } from 'svelte/store';

var unsub;
export const status = ["Ocupada", "Desocupada", "Separada", "Deshabilitada"];
export const type = ["Individual", "Compartida Doble", "Compartida Triple", "Compartida Cuadruple", "Estancia parcial"];


export const room_inventory = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("room_inventory").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const temproom_inventory = doc.data();
                temproom_inventory.id = doc.id;
                temproom_inventory.statusId = doc.data().status;
temproom_inventory.status = status[doc.data().status];
temproom_inventory.typeId = doc.data().type;
temproom_inventory.type = type[doc.data().type];

                tmp.push(temproom_inventory);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading room_inventory", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addRoom_inventory = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("room_inventory").doc();
    docRef.set(values);
    return docRef.id;
}