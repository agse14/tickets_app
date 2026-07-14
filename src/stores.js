import { writable,get } from 'svelte/store';

export const fbuser = writable(null);
export const profile = writable(null);
export const permissions = writable({});
export const openMenu = writable(false);

export function hasPermission(p, permarray){
    //var p = get(permissions);
    
    if(p.admin){
        return true;
    }
    for(var permcheck of permarray){
        //console.log('permissions',permcheck);
        if(p[permcheck]){
            return true;
        }
    }
    return false;
}