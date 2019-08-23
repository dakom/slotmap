import {Key, extract_key_id, INVALID_ID} from "./Key";
import {Option} from "fp-ts/lib/Option";
import * as O from "fp-ts/lib/Option";
import {Either} from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import {ErrorKind} from "./errors";

interface Lookup<V> {
    length: () => Readonly<number>;
    set: (key:Key, values:Array<V>) => void;
    remove: (key:Key) => void;
    update: (key:Key, values:Array<V>) => void; 
    get: (key:Key) => Option<Array<V>>;
    realloc: (alloc_amount:number) => void;
    values: Iterable<Array<V>>; 

    update_some: (key:Key, type_indices:Array<number>, values:Array<V>) => Either<ErrorKind, void>; 
    get_some: (key:Key, type_indices:Array<number>) => Option<Either<ErrorKind, Array<V>>>;
    values_some: (type_indices:Array<number>) => Either<ErrorKind, Iterable<Array<V>>>; 
}


export const init_lookup = <V>(n_value_types:number, initial_capacity?:number):Lookup<V> => {
    let _values:Array<Array<V>> = Array(n_value_types).fill(null).map(() => []);
    let indices:Uint32Array = new Uint32Array(initial_capacity ? initial_capacity : 0);
    let len:number = 0;
    const all_type_indices = Array(n_value_types).fill(null).map((_, idx) => idx);

    const validate_type_indices = (type_indices:Array<number>) =>
        type_indices.every(idx => idx < n_value_types)
            ? E.left(ErrorKind.INVALID_TYPE_INDEX)
            : E.right(undefined);

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

    const get_single_values_direct_some = (index:number, type_indices:Array<number>):Either<ErrorKind, Array<V>> => 
        //map is probably fine, but we know the optimized route
        E.map((type_indices:Array<number>) => {
            const ret = Array(n_value_types);
            const len = type_indices.length;
            for(let ridx = 0; ridx < len; ridx++) {
                ret[ridx] = _values[type_indices[ridx]][index];
            }

            return ret;
        }) (validate_type_indices(type_indices));

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

    const get_some = (key:Key, type_indices:Array<number>):Option<Either<ErrorKind, Array<V>>> => {
        const index = extract_key_id(key);
        return (indices[index] === INVALID_ID)
            ? O.none
            : O.some(get_single_values_direct_some(indices[index], type_indices))
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

    const makeValuesIteratorSome = (validated_type_indices: Array<number>): Iterator<Array<V>> => {
        let index = 0;
        const next = () => {
            if (index >= len) {
                return { done: true, value: undefined }
            } else {
                const value = get_single_values_direct(index);
                index++;
                return { done: false, value }
            }
        }

        return { next };
    }


    const update_some = (key:Key, type_indices:Array<number>, values:Array<V>):Either<ErrorKind, void> => 
        E.chain((type_indices:Array<number>) => {
            if(type_indices.length !== values.length) {
                return E.left(ErrorKind.MISMATCHED_INDEX_VALUES);
            }
            const index = extract_key_id(key);

            if(indices[index] === INVALID_ID) {
                return E.left(ErrorKind.NO_KEY);
            }
            type_indices.forEach(type_index => {
                _values[type_index][index] = values[type_index];
            })

            return E.right(undefined);
        }) (validate_type_indices(type_indices));

    const update = (key:Key, values:Array<V>):Either<ErrorKind, void> => {
        if(values.length !== _values.length) {
            return E.left(ErrorKind.NOT_ENOUGH_VALUES);
        }

        return update_some(key, all_type_indices, values); 
    }

    return {
       length: () => len,
       set,
       remove,
       update,
       get,
       realloc,
       values: {
           [Symbol.iterator]: makeValuesIterator
       },

       update_some,
       get_some,
       values_some: (type_indices:Array<number>) => {
           const validated = validate_type_indices(type_indices);
           if(E.isLeft(validated)) {
               return validated;
           }
           return E.right({
               [Symbol.iterator]: () => makeValuesIteratorSome(type_indices)
           })
       },
    };
}