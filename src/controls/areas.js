import { readable } from 'svelte/store';

var unsub;

export const areas = readable([], function start(set) {
    if (unsub == undefined) {
        unsub = db.collection("areas").orderBy('value','asc').onSnapshot((querySnapshot) => {
            const tmp = [];
            querySnapshot.forEach((doc) => {
                const item = doc.data();
                item.id = doc.id;
                item.value = item.value !== undefined ? Number(item.value) : 0;
                tmp.push(item);
            });
            set(tmp);
        }, (error) => {
            console.error("Error loading areas", error);
        });
    }
    return function stop() {
        // Keep the subscription alive for the app lifecycle.
    };
});

export const addArea = async (values) => {
    values.added = timenow;
    const docRef = db.collection("areas").doc();
    await docRef.set(values);
    return docRef.id;
};
