import {INVALID_ID, extract_key_id, extract_key_version, init_keys, Key} from "./key";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { Either } from "fp-ts/lib/Either";
import {ErrorKind} from "./errors";

/**
 * Creates a SlotMap with values of type V
 */
export interface SlotMap<A extends any[]> {
    insert: (values:A) => Key;
    remove: (key:Key) => Either<ErrorKind, void>;
    update: (key:Key, values:Array<[number, any]>) => Either<ErrorKind, void>; 
    get: (key:Key, type_indices:Array<number>) => Option<Either<ErrorKind, Array<any>>>;
    values: (type_indices:Array<number>) => Either<ErrorKind, Iterable<Array<any>>>; 
    entries: (type_indices:Array<number>) => Either<ErrorKind, Iterable<[Key,Array<any>]>>;
    keys: Iterable<Key>;
    length: () => Readonly<number>;


    get_all: (key:Key) => Option<A>;
    values_all: () => Iterable<A>; 
    entries_all: () => Iterable<[Key,A]>;
}

//Just an alias to make our intent clearer
type Values <T> = Array<T>;

export const create_slotmap = <A extends any[]>(initial_capacity?:number):SlotMap<A> => {
    //initialize to initial_capacity
    const keys = init_keys(initial_capacity);

    //Initalize to a [] for each value type
    const value_types:Array<Values<A>> = []; 

    //Sparse array where each index is basically a key
    let indices:Uint32Array = new Uint32Array(initial_capacity ? initial_capacity : 0).fill(INVALID_ID);

    let n_value_types:number = 0;

    let all_type_indices:Array<number> = [];

    /**
     * Inserts a new entry into the lookup 
     * @remarks
     * The initial insert must provide a value for every type.
     * After insertion, update() can be called to update only some values
     * 
     * @param values - the values for each type of value
     */

    const insert = (values:A):Key => {

        //would be nice to set this via the type system but w/e
        if(n_value_types === 0) {
            n_value_types = values.length;
            all_type_indices = Array(n_value_types);
            for(let i = 0; i < n_value_types; i++) {
                all_type_indices[i] = i;
                value_types[i] = [];
            }
        }

        const [key, alloc_amount] = keys.create_and_alloc();

        if(alloc_amount) {
            realloc(alloc_amount);
        }

        const index = extract_key_id(key);
        values.forEach((value, idx) => {
            value_types[idx].push(value);
        });

        indices[index] = keys.alive_len() -1; 

        return key;
    }


    /**
     * Removes an entry from the slotmap
     * @remarks 
     * @param key - the key to remove
     */

    const remove = (key:Key):Either<ErrorKind, void> => 
        E.fold(
            (err:ErrorKind) => 
                err === ErrorKind.NO_KEY
                    ? E.right(undefined)
                    : E.left(err),
            () => {
                const index = extract_key_id(key);
                if(indices[index] !== INVALID_ID) {
                    const removed = indices[index];
                    value_types.forEach(values => 
                        values.splice(removed, 1)
                    );
                    indices[index] = INVALID_ID;
                    //This could be faster if we mainained a reverse-lookup, but then that needs to be allocated etc.
                    for(let i = 0; i < indices.length-1; i++) {
                        let index = indices[i];
                        if(index !== INVALID_ID && index >= removed) {
                            indices[i] = index - 1;
                        }
                    } 
                }
                return E.right(undefined)
            }
        ) (keys.remove(key));


    /**
     * Updates an entry 
     *
     * @remarks 
     *
     * @param key - the key to remove
     */
    const update = (key:Key, values:[number, any]):Either<ErrorKind, void> => {
            const index = extract_key_id(key);

            if(indices[index] === INVALID_ID) {
                return E.left(ErrorKind.NO_KEY);
            }

            for(let i = 0; i < values.length; i++) {
                const [type_index, value] = values[i];
                if(type_index > n_value_types) {
                    return E.left(ErrorKind.INVALID_TYPE_INDEX);
                }
                value_types[type_index][index] = value; 
            }

            return E.right(undefined);
    }


    const get = (key:Key, type_indices:Array<number>):Option<Either<ErrorKind, A>> => {
        const index = extract_key_id(key);
        return (indices[index] === INVALID_ID)
            ? O.none
            : O.some(
                E.map((type_indices:Array<number>) => 
                    get_single_values_unchecked(indices[index], type_indices)
                ) (validate_type_indices(type_indices))
            )
    }

    /**
     * @remarks
     * Internal use only
     * 
     * @param type_indices - the type of values, by index
     */
    const validate_type_indices = (type_indices:Array<number>) => {
        return type_indices.every(idx => idx < n_value_types)
            ? E.right(type_indices)
            : E.left(ErrorKind.INVALID_TYPE_INDEX);
    }

    const realloc = (alloc_amount:number) => {
        const new_indices= new Uint32Array(alloc_amount);
        new_indices.set(indices);
        new_indices.fill(INVALID_ID, indices.length);
        indices = new_indices;
    }



    const get_single_values_unchecked = (index:number, validated_type_indices:Array<number>):A => {
        //map is probably fine, but we know the optimized route
        const len = validated_type_indices.length;
        const ret = Array(len);
        for(let ridx = 0; ridx < len; ridx++) {
            ret[ridx] = value_types[validated_type_indices[ridx]][index];
        }

        return ret as A;
    }

    const values_iterable = (type_indices:Array<number>):Either<ErrorKind, Iterable<A>> => {
        const validated = validate_type_indices(type_indices);
        if(E.isLeft(validated)) {
            return validated;
        }
        return E.right({
            [Symbol.iterator]: () => {
                let index = 0;
                const len = keys.alive_len();
                const next = () => {
                    if (index >= len) {
                        return { done: true, value: undefined }
                    } else {
                        const values = get_single_values_unchecked(index, type_indices);
                        index++;
                        return { done: false, value: values }
                    }
                }

                return { next };
            }
        })
    }

    const entries_iterable = (type_indices:Array<number>) => {
        const validated = validate_type_indices(type_indices);
        if(E.isLeft(validated)) {
            return validated;
        }
        return E.right({
            [Symbol.iterator]: () => {

                let index = 0;
                const key_iterator = keys[Symbol.iterator]();

                const next = () => {
                    const {done, value: key_value} = key_iterator.next();
                 
                    if (done) {
                        return { done: true, value: undefined }
                    } else {
                        const values = get_single_values_unchecked(index, type_indices);
                        index++;
                        return { done: false, value: [key_value, values] as [Key, A] }
                    }
                }

                return { next };
            }
        })
    }


    return {

        insert,
        remove,
        update,
        get,
        get_all: (key:Key) => O.map(E.getOrElse(() => null)) (get(key, all_type_indices)),
        keys,
        values: values_iterable,
        values_all: () => E.getOrElse(() => null) (values_iterable(all_type_indices)),
        entries: entries_iterable,
        entries_all: () => E.getOrElse(() => null) (entries_iterable(all_type_indices)),
        length: keys.alive_len
    };
}
