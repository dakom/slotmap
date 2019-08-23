
import {init_lookup} from "./lookup";
import {init_keys, Key} from "./key";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { Either } from "fp-ts/lib/Either";
import {ErrorKind} from "./errors";

/**
 * Creates a SlotMap with values of type V
 */
export interface SlotMap1<A> {
    insert: (value:A) => Key;
    remove: (key:Key) => Either<ErrorKind, void>;
    get: (key:Key) => Option<A>;
    update: (key:Key, value:A) => void; 
    values: Iterable<A>; 
    keys: Iterable<Key>;
    entries: Iterable<[Key,A]>;
    length: () => Readonly<number>;
}
interface SlotMap1_Internal<A> {
    insert: (values:[A]) => Key;
    remove: (key:Key) => Either<ErrorKind, void>;
    update_at_any_unchecked: (key:Key, type_index:number, value:A) => void; 
    update_at_0: (key:Key, value:A) => void; 
    update: (key:Key, values:[A]) => void; 
    get: (key:Key) => Option<[A]>;
    values: Iterable<[A]>; 
    keys: Iterable<Key>;
    entries: Iterable<[Key,[A]]>;
    length: () => Readonly<number>;
}

export interface SlotMap2<A,B> {
    insert: (values:[A,B]) => Key;
    remove: (key:Key) => Either<ErrorKind, void>;
    update_at_any_unchecked: (key:Key, type_index:number, value:A | B) => void; 
    update_at_0: (key:Key, value:A) => void; 
    update_at_1: (key:Key, value:B) => void; 
    update: (key:Key, values:[A]) => void; 
    get: (key:Key) => Option<[A,B]>;
    values: Iterable<[A,B]>; 
    keys: Iterable<Key>;
    entries: Iterable<[Key,[A,B]]>;
    length: () => Readonly<number>;
}
export interface SlotMap3<A,B,C> {
    insert: (values:[A,B,C]) => Key;
    remove: (key:Key) => Either<ErrorKind, void>;
    get: (key:Key) => Option<[A,B,C]>;
    update_at_any_unchecked: (key:Key, type_index:number, value:A | B | C) => void; 
    update_at_0: (key:Key, value:A) => void; 
    update_at_1: (key:Key, value:B) => void; 
    update_at_2: (key:Key, value:C) => void; 
    update: (key:Key, values:[A]) => void; 
    values: Iterable<[A,B,C]>; 
    keys: Iterable<Key>;
    entries: Iterable<[Key,[A,B,C]]>;
    length: () => Readonly<number>;
}
export const create_slotmap_1= <A>():SlotMap1<A> => {
    const slotmap = create_slotmap_any(1) as SlotMap1_Internal<A>;

    const makeValuesIterator = ():Iterator<A> => {
        const values = slotmap.values[Symbol.iterator]();
        const next = () => {
            const {done, value} = values.next();

            return done
                ? {done, value: undefined}
                : {done, value: value[0]};
        }
        return {next};
    }


    const makeEntriesIterator = ():Iterator<[Key, A]> => {
        const entries = slotmap.entries[Symbol.iterator]();
        const next = () => {
            const {done, value} = entries.next();
            return done
                ? {done, value: undefined as [Key,A]}
                : {done, value: [value[0], value[1][0]] as [Key,A]};
        }
        return {next};
    }
    return {
        insert: (value:A) => slotmap.insert([value]),
        remove: slotmap.remove,
        update: (key:Key, value:A) => slotmap.update_at_any_unchecked(key, 0, value),
        get: (key:Key) => O.map(xs => xs[0]) (slotmap.get(key)),
        values: {
            [Symbol.iterator]: makeValuesIterator
        },
        keys: slotmap.keys,
        entries: {
            [Symbol.iterator]: makeEntriesIterator,
        },
        length: slotmap.length
    }
}
export const create_slotmap_2= <A,B>():SlotMap2<A,B> => {
    const slotmap = create_slotmap_any(2);
    return {
        ...slotmap,
        update_at_0: (key:Key, value:A) => slotmap.update_at_any_unchecked(key, 0, value), 
        update_at_1: (key:Key, value:B) => slotmap.update_at_any_unchecked(key, 1, value), 
    }
}
export const create_slotmap_3= <A,B,C>():SlotMap3<A,B,C> => {
    const slotmap = create_slotmap_any(3);
    return {
        ...slotmap,
        update_at_0: (key:Key, value:A) => slotmap.update_at_any_unchecked(key, 0, value), 
        update_at_1: (key:Key, value:B) => slotmap.update_at_any_unchecked(key, 1, value), 
        update_at_2: (key:Key, value:B) => slotmap.update_at_any_unchecked(key, 2, value), 
    }
}


export function create_slotmap_any(n_value_types:number, initial_capacity?: number):any {
    const lookup = init_lookup<unknown>(n_value_types, initial_capacity);
    const keys = init_keys(initial_capacity);

    const insert = (values:Array<unknown>):Key => {
        const [key, alloc_amount] = keys.create_and_alloc();
        if(alloc_amount) {
            lookup.realloc(alloc_amount);
        }
        lookup.set(key, values);
        return key;
    }

    const remove = (key:Key):Either<ErrorKind, void> => 
        E.fold(
            (err:ErrorKind) => 
                err === ErrorKind.NO_KEY
                    ? E.right(undefined)
                    : E.left(err),
            () => {
                lookup.remove(key);
                return E.right(undefined)
            }
        ) (keys.remove(key));
    
    const get = (key:Key):Option<Array<unknown>> =>
        keys.is_alive(key) ? lookup.get(key) : O.none;

    const makeEntriesIterator = ():Iterator<[Key, [unknown]]> => {
        const _keys = keys[Symbol.iterator]();

        const next = () => {
            const {done, value} = _keys.next();
            return done
                ? {done, value: undefined as [Key,[unknown]]}
                : {done, value: [
                    value, 
                    O.fold 
                        (() => null, x => x) 
                        (lookup.get(value))
                  ] as [Key, [unknown]]} 
        }
        return {next};
    }

    return {
        insert,
        remove,
        get,
        values: lookup.values,
        update_at_any_unchecked: lookup.update_at_any_unchecked,
        keys,
        entries: {
           [Symbol.iterator]: makeEntriesIterator
        },
        length: lookup.length
    }

}