import {Key, extract_key_id, INVALID_ID} from "./Key";
import {Option} from "fp-ts/lib/Option";
import * as O from "fp-ts/lib/Option";


interface Lookup<V> {
    set: (key:Key, values:Array<V>) => void;
    remove: (key:Key) => void;
    update_at_any_unchecked: (key:Key, type_index:number, value:any) => void; 
    get: (key:Key) => Option<Array<V>>;
    realloc: (alloc_amount:number) => void;
    values: Iterable<Array<V>>; 
    length: () => Readonly<number>;
}


export const init_lookup = <V>(n_value_types:number, initial_capacity?:number):Lookup<V> => {
    let _values:Array<Array<V>> = Array(n_value_types).fill(null).map(() => []);
    let indices:Uint32Array = new Uint32Array(initial_capacity ? initial_capacity : 0);
    let len:number = 0;

    const realloc = (alloc_amount:number) => {
        const new_indices= new Uint32Array(alloc_amount);
        new_indices.set(indices);
        new_indices.fill(INVALID_ID, indices.length);
        indices = new_indices;
    }

    const set = (key:Key, values:Array<V>) => {
        const index = extract_key_id(key);
        if(indices[index] === INVALID_ID) {
            indices[index] = len;
            values.forEach((value, idx) => {
                _values[idx].push(value);
            });
            len++;
        }
    }

    const remove = (key:Key) => {
        const index = extract_key_id(key);
        if(indices[index] !== INVALID_ID) {
            const removed = indices[index];
            _values.forEach(values => 
                values.splice(removed, 1)
            );
            len--;
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

    const get_single_values_direct = (index:number):Array<V> => {
        //map is probably fine, but we know the optimized route
        const ret = Array(n_value_types);
        for(let ridx = 0; ridx < n_value_types; ridx++) {
            ret[ridx] = _values[ridx][index];
        }

        return ret;
    }
    const get = (key:Key):Option<Array<V>> => {
        const index = extract_key_id(key);
        return (indices[index] === INVALID_ID)
            ? O.none
            : O.some(get_single_values_direct(indices[index]))
    }

    const makeValuesIterator = ():Iterator<Array<V>> => {
        let index = 0;

        const next = () => {
            if(index >= len) {
                return {done: true, value: undefined}
            } else {
                const value = get_single_values_direct(index); 
                index++;
                return {done: false, value}
            }
        }

        return {next};
    }

    const update_at_any_unchecked = (key:Key, type_index:number, value:any) => {
        const index = extract_key_id(key);
        _values[type_index][index] = value;
    }

    return {
       set,
       remove,
       get,
       update_at_any_unchecked,
       values: {
           [Symbol.iterator]: makeValuesIterator
       },
       realloc,
       length: () => len
    };
}