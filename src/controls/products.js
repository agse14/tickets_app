import { readable } from 'svelte/store';

var unsub;
export const store = ["HEB", "Soriana", "Fruteria", "Walmart", "Kesos y kosas", "DCA Carnes", "Pollos K-le", "SAMS Club"];
export const type = ["Despensa", "Limpieza"];
export const unit = ["manojo", "pieza", "kilo", "gramo", "litro"];
export const category = ["Carnes fr\u00edas", "Frutas y Verduras", "Carnes", "Pollo", "Kesos y kosas", "Abarrotes"];


export const products = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("products").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const tempproducts = doc.data();
                tempproducts.id = doc.id;
                tempproducts.store = store[doc.data().store];
tempproducts.type = type[doc.data().type];
tempproducts.unit = unit[doc.data().unit];
tempproducts.category = category[doc.data().category];

                tmp.push(tempproducts);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading products", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});