import { readable } from 'svelte/store';

var unsub;
export const civil = ["soltero", "casado", "divorciado", "divorciado c/ hijos"];
export const contact_relation = ["Familiar", "Amigo", "Laboral"];
export const contact_relation_2 = ["Familiar", "Amigo", "Laboral"];
export const contact_relation_3 = ["Familiar", "Amigo", "Laboral"];
export const contact_relation_eme = ["Familiar", "Amigo", "Laboral"];
export const gender = ["Hombre", "Mujer"];
export const paymentperiod = ["Semanal", "Quincenal"];
export const payroll = ["Fijo", "Guardia"];
export const study = ["Sin Estudios", "primaria", "secundaria", "prepa", "t\u00e9cnico", "profesional", "estudiante"];
export const type = ["Enfermero B\u00e1sico", "Enfermero Avanzado", "Cuidador", "Doctor", "Empleado", "Prueba COVID", "Otro", "Proveedor Rayos X", "Proveedor Laboratorio", "Proveedor Masajes"];


export const partners = readable([], function start(set) {
    if(unsub == undefined){
        unsub = db.collection("partners").orderBy('added','desc').onSnapshot(async (querySnapshot) => {
            const tmp = [];
            
            querySnapshot.forEach((doc) => {
                // console.log(`${doc.id} => ${doc.data()}`);
                const temppartners = doc.data();
                temppartners.id = doc.id;
                temppartners.civilId = doc.data().civil;
temppartners.civil = civil[doc.data().civil];
temppartners.contact_relationId = doc.data().contact_relation;
temppartners.contact_relation = contact_relation[doc.data().contact_relation];
temppartners.contact_relation_2Id = doc.data().contact_relation_2;
temppartners.contact_relation_2 = contact_relation_2[doc.data().contact_relation_2];
temppartners.contact_relation_3Id = doc.data().contact_relation_3;
temppartners.contact_relation_3 = contact_relation_3[doc.data().contact_relation_3];
temppartners.contact_relation_emeId = doc.data().contact_relation_eme;
temppartners.contact_relation_eme = contact_relation_eme[doc.data().contact_relation_eme];
temppartners.genderId = doc.data().gender;
temppartners.gender = gender[doc.data().gender];
temppartners.paymentperiodId = doc.data().paymentperiod;
temppartners.paymentperiod = paymentperiod[doc.data().paymentperiod];
temppartners.payrollId = doc.data().payroll;
temppartners.payroll = payroll[doc.data().payroll];
temppartners.studyId = doc.data().study;
temppartners.study = study[doc.data().study];
temppartners.typeId = doc.data().type;
temppartners.type = type[doc.data().type];

                tmp.push(temppartners);
                
            });
            set(tmp);
        
            
        },function(error) {
            console.log("Error loading partners", error);
        });
    }
	return function stop() {
        //unsub();
        //unsub == undefined;
	};
});

export const addPartners = async (values) =>{
    values.added = timenow;
    const docRef = await db.collection("partners").doc();
    docRef.set(values);
    return docRef.id;
}