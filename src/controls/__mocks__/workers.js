import { readable } from 'svelte/store';

var unsub;
export const paymentperiod = ["Semanal", "Quincenal"];
export const payroll = ["Fijo", "Guardia"];
export const status = ["Activo", "Inactivo", "Baja"];
let data = [
    {id:"pM6xuIggkxdHmzaN3n82",name:"Aldo pruen", paymentperiod:0},
    {id:"pM6xuIggkxdHmzaN3mes",name:"Aldo Mensual", paymentperiod:1},
];

export const workers = readable(data,function start(set) {
    // console.log("init workers");
 return function stop(){

 }   
});

export const addWorkers = async (values) =>{
    values.added = timenow;
    data.push(values);
    workers.set(data);
    return "aaa";
}