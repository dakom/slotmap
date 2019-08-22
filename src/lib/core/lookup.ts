import {Key, extract_key_id} from "./Key";

interface Lookup<V> {
    set: (key:Key, value:V) => void;
    remove: (key:Key) => void;
    get: (key:Key) => V;
    values: Readonly<Array<V>>
}
export const init_lookup = <V>():Lookup<V> => {
    const values:Array<V> = [];

    const set = (key:Key, value:V) => {
        const index = extract_key_id(key);
        values[index] = value;
    }

    const remove = (key:Key) => {
        const index = extract_key_id(key);
        delete values[index];
    }

    const get = (key:Key):V => {
        const index = extract_key_id(key);
        return values[index];
    }

    return {
       set,
       remove,
       get,
       values
    };
}