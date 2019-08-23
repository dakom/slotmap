import {Key, extract_key_id, INVALID_ID} from "./Key";
import {Option} from "fp-ts/lib/Option";
import * as O from "fp-ts/lib/Option";

interface Lookup<V> {
    set: (key:Key, value:V) => void;
    remove: (key:Key) => void;
    get: (key:Key) => Option<V>;
    realloc: (alloc_amount:number) => void;
    values: Readonly<Array<V>>;

}
export const init_lookup = <V>():Lookup<V> => {
    const values:Array<V> = [];
    let indices:Uint32Array = new Uint32Array();

    const realloc = (alloc_amount:number) => {
        const new_indices= new Uint32Array(alloc_amount);
        new_indices.set(indices);
        new_indices.fill(INVALID_ID, indices.length);
        indices = new_indices;

    }

    const set = (key:Key, value:V) => {
        const index = extract_key_id(key);
        if(indices[index] === INVALID_ID) {
            indices[index] = values.length;
            values.push(value);
        }
    }

    const remove = (key:Key) => {
        const index = extract_key_id(key);
        if(indices[index] !== INVALID_ID) {
            const removed = indices[index];
            values.splice(removed, 1);
            indices[index] = INVALID_ID;
            //This could be faster if we mainained a reverse-lookup, but then that needs to be allocated etc.
            for(let i = 0; i < indices.length-1; i++) {
                let index = indices[i];
                if(index !== INVALID_ID && index >= removed) {
                    indices[i] = index - 1;
                }
            } 
        }
    }

    const get = (key:Key):Option<V> => {
        const index = extract_key_id(key);
        return (indices[index] === INVALID_ID)
            ? O.none
            : O.some(values[indices[index]]);
    }

    return {
       set,
       remove,
       get,
       values,
       realloc
    };
}