
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
export interface SlotMap<V> {
    //Insert a value, get a unique Key back (which can be used to remove or get the value later)
    insert: (value:V) => Key;
    //Remove a key/value
    remove: (key:Key) => Either<ErrorKind, void>;
    //Get a value by providing the Key
    get: (key:Key) => Option<V>;
    //Array of values
    values: () => Readonly<Array<V>>;
    //Array of keys 
    keys: () => Readonly<Array<Key>>;
    //Array of key/value pairs
    entries: () => Readonly<Array<[Key,V]>>;
}
export function create_slotmap<V>():SlotMap<V> {
    const lookup = init_lookup<V>();
    const keys = init_keys();

    const insert = (value:V):Key => {
        const [key, alloc_amount] = keys.create_and_alloc();
        if(alloc_amount) {
            lookup.realloc(alloc_amount);
        }
        lookup.set(key, value);
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
    
    const get = (key:Key):Option<V> =>
        keys.is_alive(key) ? lookup.get(key) : O.none;

    return {
        insert,
        remove,
        get,
        values: () => lookup.values,
        keys: () => Array.from(keys.list_alive()),
        entries: () => 
            Array.from(keys.list_alive())
                .map((key:Key) => ([key, O.getOrElse(() => null) (lookup.get(key))]))
    }

}