import {create_slotmap, extract_key_id, ErrorKind} from "../lib/lib";

import * as O from "fp-ts/lib/Option";
import {Option} from "fp-ts/lib/Option";
import {Either} from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import { stringLiteral } from "@babel/types";


const extractOption = <V>(v:Option<V>):V => 
    O.getOrElse(() => null) (v);

const extractEither = <V>(v:Either<any,V>):V => 
    E.getOrElse(() => null) (v);

const unwrap_get = <V>(target:Option<Either<any, V>>):V =>
    E.fold(
        e => {
            throw new Error(String(e));
        }, 
        x => x
    ) (O.fold(
        () => E.left("no result"),
        x => x as Either<any, V>
    ) (target)) as V;


test("slotmap", () => {
    const slotmap = create_slotmap<[string, Option<string>, number]>(3);

    const key1 = slotmap.insert(["hello", O.some("world"), 10]);
    const key2 = slotmap.insert(["ok", O.none, 42]);


    //basic insert / get_all
    expect("hello").toBe(extractOption(slotmap.get_all(key1))[0]);
    expect("world").toBe(extractOption(extractOption(slotmap.get_all(key1))[1]));
    expect(10).toBe(extractOption(slotmap.get_all(key1))[2]);

    expect("ok").toBe(extractOption(slotmap.get_all(key2))[0]);
    expect(null).toBe(extractOption(extractOption(slotmap.get_all(key2))[1]));
    expect(42).toBe(extractOption(slotmap.get_all(key2))[2]);

    //update
    slotmap.replace(key2, [[1, O.some("computer")]]);
    expect("computer").toBe(extractOption(extractOption(slotmap.get_all(key2))[1]));

    //removal
    const key3 = slotmap.insert(["yay", O.some("this"), 7]);
    expect(3).toBe(slotmap.length());
    slotmap.remove(key2);
    expect(2).toBe(slotmap.length());

    //iteration
    const transposed:{
        label1s: Array<string>,
        label2s: Array<string>,
        nums: Array<number>,
     } = {
        label1s: [],
        label2s: [],
        nums: []
    };

    for(const value of slotmap.values_all()) {
        const [label1, label2, num] = value;
        transposed.label1s.push(label1);
        transposed.label2s.push(extractOption(label2));
        transposed.nums.push(num);
    }

    expect(["hello","yay"]).toEqual(transposed.label1s);
    expect(["world", "this"]).toEqual(transposed.label2s);
    expect([10,7]).toEqual(transposed.nums);

    //get sparse
    expect(["hello",10]).toEqual(unwrap_get(slotmap.get(key1, [0,2])));

    //iteration sparse
    expect([
        ["hello", 10],
        ["yay", 7]
    ]).toEqual(Array.from(extractEither(slotmap.values([0,2]))));

    //iteration entries sparse
    expect([
        [key1, ["hello", 10]],
        [key3, ["yay", 7]]
    ]).toEqual(Array.from(extractEither(slotmap.entries([0,2]))));

    //iteration w/ for 
    let index = 0;
    for(const [label, num] of extractEither(slotmap.values<[string, number]>([0,2]))) {
        if(index === 0) {
            expect("hello").toBe(label);
            expect(10).toBe(num);
        } else {
            expect("yay").toBe(label);
            expect(7).toBe(num);
        }

        index++;
    }

    //update via iteration
    slotmap.update<[string, number]>(([label, num], key) => [label + "!", num + 1], [0,2])
    expect([
        ["hello!", 11],
        ["yay!", 8]
    ]).toEqual(Array.from(extractEither(slotmap.values([0,2]))));


    //update via rw iteration
    slotmap.update_rw<[string, number], [number]>(
        ([label, num], key) => 
            label === "hello!" ? [9] : [num]
        , [0, 2], [2]
    );

    expect([
        ["hello!", 9],
        ["yay!", 8]
    ]).toEqual(Array.from(extractEither(slotmap.values([0,2]))));
});
