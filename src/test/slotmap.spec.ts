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