import {create_slotmap, extract_key_id} from "../lib/lib";

import * as O from "fp-ts/lib/Option";
import {Option} from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";

const LABEL = (desc: string): string => `[slotmap] ${desc}`;

const extractOption = <V>(v:Option<V>):V => 
    O.getOrElse(() => null) (v);

test(LABEL("insert"), () => {

    const slotmap = create_slotmap();

    const key1 = slotmap.insert("hello");
    const key2 = slotmap.insert("world");

    expect("hello").toBe(extractOption(slotmap.get(key1)));
    expect("world").toBe(extractOption(slotmap.get(key2)));

    expect(["hello","world"]).toEqual(slotmap.values());
    expect([key1, key2]).toEqual(slotmap.keys());
    expect([[key1, "hello"],[key2, "world"]]).toEqual(slotmap.entries());
});

test(LABEL("insert and remove"), () => {

    const slotmap = create_slotmap();

    const key1 = slotmap.insert("hello");
    const key2 = slotmap.insert("world");

    slotmap.remove(key2);
    expect("hello").toBe(extractOption(slotmap.get(key1)));
    expect(O.none).toBe(slotmap.get(key2));
    slotmap.remove(key1);
    expect(O.none).toBe(slotmap.get(key1));

    expect(0).toBe(slotmap.values().length);
    expect(0).toBe(slotmap.keys().length);
    expect(0).toEqual(slotmap.entries().length);


    const key3 = slotmap.insert("hello");
    expect("hello").toBe(extractOption(slotmap.get(key3)));
    slotmap.remove(key3);
    expect(0).toBe(slotmap.values().length);

    const keys = Array(100).fill(null).map(() => slotmap.insert("hello"));
    expect(100).toBe(slotmap.values().length);
    keys.forEach(key => {
        slotmap.remove(key);
    });
    expect(0).toBe(slotmap.values().length);
});