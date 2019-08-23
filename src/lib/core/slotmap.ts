
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
    length: () => Readonly<number>;
    insert: (value:A) => Key;
    remove: (key:Key) => Either<ErrorKind, void>;
    get: (key:Key) => Option<A>;
    update: (key:Key, value:A) => void; 
    values: Iterable<A>; 
    keys: Iterable<Key>;
    entries: Iterable<[Key,A]>;
}
interface SlotMap<A> {
    length: () => Readonly<number>;
    insert: (values:Array<A>) => Key;
    remove: (key:Key) => Either<ErrorKind, void>;
    get: (key:Key) => Option<Array<A>>;
    update: (key:Key, values:Array<A>) => void; 
    values: Iterable<Array<A>>; 
    keys: Iterable<Key>;
    entries: Iterable<[Key,Array<A>]>;
    update_some: (key:Key, type_indices:Array<number>, values:Array<A>) => Either<ErrorKind, void>; 
    get_some: (key:Key, type_indices:Array<number>) => Option<Either<ErrorKind, Array<A>>>;
    values_some: (type_indices:Array<number>) => Either<ErrorKind, Iterable<Array<A>>>; 
    entries_some: (type_indices:Array<number>) => Either<ErrorKind, Iterable<[Key,Array<A>]>>;
}
export const create_slotmap_1= <A>():SlotMap1<A> => {
    const slotmap = create_slotmap(1) as SlotMap<A>;

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
        update: (key:Key, value:A) => slotmap.update_some(key, [0], [value]),
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

export function create_slotmap(n_value_types:number, initial_capacity?: number):SlotMap<any> {
    const lookup = init_lookup<unknown>(n_value_types, initial_capacity);
    const keys = init_keys(initial_capacity);

    const validate_type_indices = (type_indices:Array<number>) =>
        type_indices.every(idx => idx < n_value_types)
            ? E.left(ErrorKind.INVALID_TYPE_INDEX)
            : E.right(undefined);
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
    
    const get = (key:Key):Option<Array<any>> =>
        keys.is_alive(key) ? lookup.get(key) : O.none;

    const makeEntriesIterator = ():Iterator<[Key, [any]]> => {
        const _keys = keys[Symbol.iterator]();

        const next = () => {
            const {done, value} = _keys.next();
            return done
                ? {done, value: undefined as [Key,[any]]}
                : {done, value: [
                    value, 
                    O.fold 
                        (() => null, x => x) 
                        (lookup.get(value))
                  ] as [Key, [unknown]]} 
        }
        return {next};
    }

    const makeEntriesIteratorSome = (type_indices:Array<number>):Iterator<[Key, [any]]> => {
        const _keys = keys[Symbol.iterator]();

        const next = () => {
            const {done, value} = _keys.next();

            return done
                ? {done, value: undefined as [Key,[any]]}
                : {done, value: [
                    value, 
                    O.fold 
                        (() => null, x => x) 
                        (lookup.get_some(value, type_indices))
                  ] as [Key, [unknown]]} 
        }
        return {next};
    }
    return {
        length: lookup.length,
        insert,
        remove,
        get,
        update: lookup.update,
        values: lookup.values,
        keys,
        entries: {
           [Symbol.iterator]: makeEntriesIterator
        },
        update_some: lookup.update_some,
        get_some: lookup.get_some,
        values_some: lookup.values_some,

        entries_some: (type_indices:Array<number>) => {
           const validated = validate_type_indices(type_indices);
           if(E.isLeft(validated)) {
               return validated;
           }
           return E.right({
               [Symbol.iterator]: () => makeEntriesIteratorSome(type_indices)
           })
       },
    }

}