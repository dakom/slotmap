import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { Either } from "fp-ts/lib/Either";
import {ErrorKind} from "./errors"
/**
 * Aliases to help the type checker.
 * Unfortunately there is no u32 in JS, so we use number.
 */
export type Key = number;
export type KeyList = Uint32Array;
export type KeyId = number;
export type KeyVersion = number;

/**
 * A key is 32-bits split into two parts: the ID and the VERSION
 * The upper 12 bits are the VERSION and the lower 20 bits are the ID
 * The >>> 0 is required to treat the number as a u32
 */

export const N_ID_BITS = 20;
export const N_VERSION_BITS = 32 - N_ID_BITS;
export const MAX_ID= 0xfffff;
export const ID_MASK = MAX_ID;
export const MAX_VERSION = 0xfff;
export const VERSION_MASK = (MAX_VERSION << N_ID_BITS) >>> 0;

/**
 * This is currently only used in one place - checking the end of the recycle list
 */
export const INVALID_ID = ID_MASK;

/**
 * The amount to allocate each time we run out of space, in number of keys
 */
const ALLOC_CAPACITY = 64;

/**
 * Flags for passing to `list()`
 */
export enum KeyListFilter {
  ALIVE = 1,
  DEAD = 2
}

/**
 * extracts the id from a given key
 */
export const extract_key_id = (key: Key): KeyId => key & ID_MASK;

/**
 * extracts the version from a given key
 */
export const extract_key_version = (key: Key): KeyVersion =>
  (key & VERSION_MASK) >>> N_ID_BITS;

 /**
   * creates an key out of thin air
   * does not store it it
   * The >>> 0 is required to treat the number as an u32
   */
const forge = ({ id, version }: { id: number; version: number }): Key =>
  (((version << N_ID_BITS) & VERSION_MASK) | (id & ID_MASK)) >>> 0

/**
 * This is not exported to the library, rather it is called by `world`
 */
export const init_keys = (initial_capacity:Option<number>) => {
  //pointer to the last destroyed key
  let destroyed: Option<KeyId> = O.none;

  //when the cursor hits this, realloc
  let next_capacity_target: number = O.fold(() => 0, (x:number) => x) (initial_capacity);
  //next spot available for appending
  let append_cursor: number = 0;

  //our list!
  let keys: KeyList = new Uint32Array(next_capacity_target);

  const is_alive = (key: Key): boolean => {
    const id = extract_key_id(key);
    return id < append_cursor && keys[id] === key;
  };

  const list_all = (): KeyList => keys.slice(0, append_cursor);

  const list_alive = (): KeyList =>
    list_all().filter(
      (key: Key, index: number) => extract_key_id(key) === index
    );

  const create_and_alloc = (): [Key, number] =>
    O.fold(
      () => {
        let realloc_amount = 0;
        if (append_cursor === next_capacity_target) {
          next_capacity_target += ALLOC_CAPACITY;
          const new_keys = new Uint32Array(next_capacity_target);
          new_keys.set(keys);
          keys = new_keys;
          realloc_amount = next_capacity_target;
        }
        const id = append_cursor;
        const version = 0;
        const key = forge({ id, version });
        keys[id] = key;

        append_cursor++;
        return [key, realloc_amount] as any
      },
      (index: KeyId) => {
        const version = extract_key_version(keys[index]);
        const destroyed_id = extract_key_id(keys[index]);
        destroyed = destroyed_id === INVALID_ID ? O.none : O.some(destroyed_id);

        const key = forge({ id: index, version });
        keys[index] = key;

        return [key, 0] as any
      }
    )(destroyed);

  const create = ():Key => create_and_alloc()[0];

  const remove = (key: Key): Either<ErrorKind, void> => {
    const id = extract_key_id(key);

    if (id > append_cursor || keys[id] !== key) {
      return E.left(ErrorKind.NO_KEY);
    }

    const next_id = O.fold(() => INVALID_ID, (next_id: KeyId) => next_id)(
      destroyed
    );

    if (next_id === id) {
      return E.left(ErrorKind.EXHAUSTED_KEY_REMOVAL);
    }
    const version = extract_key_version(key);

    const next_version = version === MAX_VERSION ? 0 : version + 1;

    keys[id] = forge({ id: next_id, version: next_version });

    destroyed = O.some(id);

    return E.right(null);
  };

 

  /**
   * Just for debugging
   */
  const destroyed_to_string = (): string =>
    O.fold(
      () => "NONE",
      (id: KeyId) => (id === INVALID_ID ? "INVALID" : String(id))
    )(destroyed);

  /**
     * to string representation of a single key as (ID|VERSION)
     * 
       If ID == INVALID_ID then it will be INVALID
       If ID > keys.length-1 and !== INVALID_ID then it's ERROR
       If ID !== index in keys then it will be PTR[N]
       Otherwise, it's E[N] where N is KeyId
    */
  const key_to_string = (key: Key): string => {
    const id = extract_key_id(key);

    const get_proper_id_str = () => {
      const ptr_id = extract_key_id(keys[id]);
      return ptr_id === id ? `E${id}` : `PTR${id}`;
    };

    const id_str =
      id === INVALID_ID
        ? "INVALID"
        : id > keys.length - 1
        ? "ERROR"
        : get_proper_id_str();

    return `(${id_str}|V${extract_key_version(key)})`;
  };

  const key_to_string_raw = (key: Key): string => {
    return `(E${extract_key_id(key)}|V${extract_key_version(key)})`;
  };
  /**
   * to string representation of an array of keys
   */
  const _list_to_string = (
    formatter: (key: Key) => string
  ) => (): string =>
    list_all().reduce((acc, curr, index) => {
      const str = formatter(curr);
      return index ? `${acc}, ${str}` : acc + str;
    }, "[") + "]";

  const list_to_string = _list_to_string(key_to_string);
  const list_to_string_raw = _list_to_string(key_to_string_raw);

  /**
   * The exports
   */
  return {
    create,
    create_and_alloc,
    list_all,
    list_alive,
    is_alive,
    remove,
    destroyed_to_string,
    key_to_string,
    key_to_string_raw,
    list_to_string,
    list_to_string_raw
  };
};
