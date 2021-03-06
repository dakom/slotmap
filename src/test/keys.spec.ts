import {init_keys, extract_key_id, extract_key_version, MAX_VERSION} from "../lib/core/key";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";

const LABEL = (desc: string): string => `[keys] ${desc}`;

test(LABEL("create"), () => {

    const keys = init_keys();
    let key = keys.create();

    let key_id = extract_key_id(key);
    let key_version = extract_key_version(key);

    expect(0).toBe(key_id);
    expect(0).toBe(key_version);

    expect(key).toBe(keys.get_at_index(key_id));

    key = keys.create();

    key_id = extract_key_id(key);
    key_version = extract_key_version(key);

    expect(1).toBe(key_id);
    expect(0).toBe(key_version);
    expect(key).toBe(keys.get_at_index(key_id));
    
    const all_keys = keys.list_all();

    key = all_keys[0];
    key_id = extract_key_id(key);
    key_version = extract_key_version(key);
    expect(0).toBe(key_id);
    expect(0).toBe(key_version);
    expect(key).toBe(keys.get_at_index(key_id));

    key = all_keys[1];
    key_id = extract_key_id(key);
    key_version = extract_key_version(key);
    expect(1).toBe(key_id);
    expect(0).toBe(key_version);
    expect(key).toBe(keys.get_at_index(key_id));
});
test(LABEL("remove"), () => {
    const keys = init_keys();

    const key_0 = keys.create();
    const key_1 = keys.create();
    const key_2 = keys.create();
    keys.remove(key_0);
    keys.remove(key_2);

    const alive_ids = Uint32Array.from(keys).map(extract_key_id);

    expect(Uint32Array.from([1])).toEqual(alive_ids);
});

test(LABEL("add, remove, add"), () => {
    const keys = init_keys();

    const key_0 = keys.create();
    const key_1 = keys.create();
    const key_2 = keys.create();
    const key_3 = keys.create();
    keys.remove(key_1);
    keys.remove(key_2);

    keys.create();
    keys.create();

    const alive_keys = Uint32Array.from(keys);
    const alive_ids = alive_keys.map(extract_key_id);
    const alive_versions = alive_keys.map(extract_key_version);

    expect(Uint32Array.from([0, 1,2,3])).toEqual(alive_ids);
    expect(Uint32Array.from([0, 1,1,0])).toEqual(alive_versions);
    expect(alive_keys[0]).toBe(keys.get_at_index(alive_ids[0]));

    //console.log(keys_to_string(alive_keys));

});

//This is correct for now... should be lower though! 
test(LABEL("version spread"), () => {
    const keys = init_keys();

    const tmp_keys = new Array(10).fill(null).map(keys.create);
    const list = keys.list_all();

    tmp_keys.forEach(keys.remove);

    for(let i = 0; i < 100; i++) {
        const key = keys.create();
        keys.remove(key);
    }

    keys.create();

    const alive_keys = Uint32Array.from(keys);
    const alive_ids = alive_keys.map(extract_key_id);
    const alive_versions = alive_keys.map(extract_key_version);

    expect(Uint32Array.from([101])).toEqual(alive_versions);
});

test(LABEL("version wrap"), () => {
    const keys = init_keys();

    const tmp_keys = new Array(10).fill(null).map(keys.create);
    const list = keys.list_all();

    tmp_keys.forEach(keys.remove);

    for(let x = 0; x < 3; x++) {
        for(let y = 0; y < MAX_VERSION+1; y++) {
            const key = keys.create();
            keys.remove(key);
        }
    }

    keys.create();

    const alive_keys = Uint32Array.from(keys);

    //console.log("len:", keys.list_all().length, "alive:", alive_keys.length);

    const alive_ids = alive_keys.map(extract_key_id);
    const alive_versions = alive_keys.map(extract_key_version);

    expect(Uint32Array.from([1])).toEqual(alive_versions);
});

/*

test(LABEL("printout"), () => {

    const keys = init_keys();

    const log = (label:string) => {
        const destroyed_str = keys.destroyed_to_string();
        console.log(
            label 
            + `\n destroyed is ${destroyed_str}`
            + `\n ${keys.list_to_string()}`
        );
    }

    const log_with_key = (label:string) => (key:Entity) => {
        log(`${label}: ${keys.key_to_string(key)}`);
    }

    const log_with_raw_key = (label:string) => (key:Entity) => {
        log(`${label}: ${keys.key_to_string_raw(key)}`);
    }

    let E0 = keys.create();
    let E1 = keys.create();
    let E2 = keys.create();
    log("Add 3 keys:");

    keys.remove(E1);
    log("Remove E1");

    let E_tmp = keys.create();
    log_with_key(`Add an key`) (E_tmp); 

    keys.remove(E_tmp);
    log_with_raw_key(`Remove`) (E_tmp);

    keys.remove(E0);
    log(`Remove E0`);

    keys.remove(E2);
    log(`Remove E2`);

    E_tmp  = keys.create();
    log_with_key(`Add an key`) (E_tmp); 

    E_tmp  = keys.create();
    log_with_key(`Add an key`) (E_tmp); 

    E_tmp  = keys.create();
    log_with_key(`Add an key`) (E_tmp); 

    E_tmp  = keys.create();
    log_with_key(`Add an key`) (E_tmp); 
});
*/

