function getIcon(s){
    if(s == 0) return 'mdi-television';
    if(s == 1) return 'mdi-blender';
    if(s == 2) return 'mdi-flower';
    if(s == 3) return 'mdi-bed-empty';
    if(s == 4) return 'mdi-fan';
    if(s == 5) return 'mdi-washing-machine';
    if(s == 6) return 'mdi-human';
    return 'mdi-clipboard-account';
}
function getLabel(s){
    if(s == 0) return 'Sala';
    if(s == 1) return 'Cocina';
    if(s == 2) return 'Jardin';
    if(s == 3) return 'Cuartos';
    if(s == 4) return 'Electrónicos';
    if(s == 5) return 'Lavandería';
    if(s == 6) return 'Equipo médico';
    return 'mdi-clipboard-account';
}
let steps = 7;
let stepArray = [[
    {id:'clean_0',label:'Baño principal'},
    {id:'clean_0_1',label:'Aspecto y olor area principal'},
    {id:'clean_0_2',label:'Ventilación e iluminación area general'},
    {id:'clean_0_3',label:'Techo y muebles área general'},
    {id:'clean_0_4',label:'Puertas principales, cuartos y areas comunes'},
    {id:'clean_0_5',label:'Aseo, imagen y olor cuartos recidentes'},
    {id:'clean_0_6',label:'Contenedores y manejo de basura'},
    {id:'clean_0_7',label:'Ventanas y puertas de cristal'},
    {id:'clean_obs',label:'Observaciones'},
        ],[
    {id:'clean_0_kitchen',label:'Estado de estufa y aparatos electrodomésicos'},
    {id:'clean_0_1_kitchen',label:'Orden y limpieza en alacenas y contenedores'},
    {id:'clean_0_2_kitchen',label:'Correcto manejo de desechos y contenedores'},
    {id:'clean_0_3_kitchen',label:'Orden y estado de alimentos'},
    {id:'clean_0_4_kitchen',label:'Limpieza y estado de anaqueles y cocina'},
    {id:'clean_0_5_kitchen',label:'Pisos y olor en cocina'},
    {id:'clean_0_6_kitchen',label:'Limpieza y estado de comedores'},
    {id:'clean_0_7_kitchen',label:'Imagen y limpieza del cocinero'},
    {id:'clean_obs_kitchen',label:'Observaciones'},
    ],[
    {id:'clean_0_garden',label:'Estado e imagen exterior'},
    {id:'clean_0_1_garden',label:'Limpieza jardines y patios'},
    {id:'clean_0_2_garden',label:'Estado de muebles exteriores'},
    {id:'clean_0_3_garden',label:'Iluminación patio y exteriores'},
    {id:'clean_0_4_garden',label:'Césped y áreas verdes'},
    {id:'clean_0_5_garden',label:'Fumigación'},
    {id:'clean_obs_garden',label:'Observaciones'},
    ],[
    {id:'clean_0_rooms',label:'Estado y limpieza de camas'},
    {id:'clean_0_1_rooms',label:'Muebles y closets'},
    {id:'clean_0_2_rooms',label:'Ventanas y cortinas'},
    {id:'clean_0_3_rooms',label:'Pintura e iluminación'},
    {id:'clean_0_4_rooms',label:'Baños y pisos'},
    {id:'clean_0_5_rooms',label:'Techo y paredes'},
    {id:'clean_obs_rooms',label:'Observaciones'},
    ],[
    {id:'clean_0_devices',label:'Climas y calefacciones'},
    {id:'clean_0_1_devices',label:'Abanicos de techo y piso'},
    {id:'clean_0_2_devices',label:'Contactos de luz'},
    {id:'clean_0_3_devices',label:'Puertas cuartos, entradas y salidas'},
    {id:'clean_0_4_devices',label:'Drenajes y tuberias'},
    {id:'clean_obs_devices',label:'Observaciones'},
    ],[
    {id:'check',label:'Orden de líquidos y polvos de limpieza'},
    {id:'check_laundry',label:'Estado y correcto uso de las lavadoras y secadoras'},
    {id:'check_laundry_1',label:'Limpieza del área'},
    {id:'check_laundry_2',label:'Paredes y pisos'},
    {id:'check_laundry_3',label:'Fugas y drenajes'},
    {id:'clean_obs_laundry',label:'Observaciones'},
    ],[
    {id:'check_0',label:'Libres de bacterias y contaminación'},
    {id:'check_1',label:'Sillas de baño limpias'},
    {id:'check_2',label:'Sillas de ruedas completas'},
    {id:'check_3',label:'Barandales libres y bien instalados'},
    {id:'check_4',label:'Estado óptimo de fajas personal'},
    {id:'check_5',label:'Estado óptimo de cinturones de sujeción'},
    {id:'check_6',label:'Material desechable para procedimientos'},
    {id:'clean_obs_equipment',label:'Observaciones'}
    ]];

export {steps, getIcon, getLabel, stepArray};