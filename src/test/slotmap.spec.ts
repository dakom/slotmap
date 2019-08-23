import {create_slotmap_1, create_slotmap_3, extract_key_id} from "../lib/lib";

import * as O from "fp-ts/lib/Option";
import {Option} from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { stringLiteral } from "@babel/types";
import { triggerAsyncId } from "async_hooks";

const LABEL = (desc: string): string => `[slotmap] ${desc}`;

const extractOption = <V>(v:Option<V>):V => 
    O.getOrElse(() => null) (v);

test(LABEL("insert slotmap_1"), () => {

    const slotmap = create_slotmap_1();

    const key1 = slotmap.insert("hello");
    const key2 = slotmap.insert("world");

    expect("hello").toBe(extractOption(slotmap.get(key1)));
    expect("world").toBe(extractOption(slotmap.get(key2)));


    expect(["hello","world"]).toEqual(Array.from(slotmap.values));
    expect([key1, key2]).toEqual(Array.from(slotmap.keys));
    expect([[key1, "hello"],[key2, "world"]]).toEqual(Array.from(slotmap.entries));
});

test(LABEL("insert and remove slotmap_1"), () => {

    const slotmap = create_slotmap_1();

    const key1 = slotmap.insert("hello");
    const key2 = slotmap.insert("world");

    slotmap.remove(key2);

    expect("hello").toBe(extractOption(slotmap.get(key1)));
    expect(O.none).toBe(slotmap.get(key2));
    slotmap.remove(key1);
    expect(O.none).toBe(slotmap.get(key1));

    expect(0).toBe(slotmap.length());


    const key3 = slotmap.insert("hello");
    expect("hello").toBe(extractOption(slotmap.get(key3)));
    slotmap.remove(key3);
    expect(0).toBe(slotmap.length());

    const keys = Array(100).fill(null).map(() => slotmap.insert("hello"));
    expect(100).toBe(slotmap.length());
    keys.forEach(key => {
        slotmap.remove(key);
    });
    expect(0).toBe(slotmap.length());
});

test(LABEL("update slotmap_1"), () => {

    const slotmap = create_slotmap_1();

    const key1 = slotmap.insert("hello");
    const key2 = slotmap.insert("world");

    slotmap.update(key2, "!");

    expect("hello").toBe(extractOption(slotmap.get(key1)));
    expect("!").toBe(extractOption(slotmap.get(key2)));

    expect(["hello","!"]).toEqual(Array.from(slotmap.values));
    expect([key1, key2]).toEqual(Array.from(slotmap.keys));
    expect([[key1, "hello"],[key2, "!"]]).toEqual(Array.from(slotmap.entries));
});


test(LABEL("various slotmap_3"), () => {

    const slotmap = create_slotmap_3<string, Option<string>, number>();

    const key1 = slotmap.insert(["hello", O.some("world"), 10]);
    const key2 = slotmap.insert(["ok", O.none, 42]);

    expect("hello").toBe(extractOption(slotmap.get(key1))[0]);
    expect("world").toBe(extractOption(extractOption(slotmap.get(key1))[1]));
    expect(10).toBe(extractOption(slotmap.get(key1))[2]);


    expect("ok").toBe(extractOption(slotmap.get(key2))[0]);
    expect(null).toBe(extractOption(extractOption(slotmap.get(key2))[1]));
    expect(42).toBe(extractOption(slotmap.get(key2))[2]);


    slotmap.update_at_1(key2, O.some("computer"));
    expect("computer").toBe(extractOption(extractOption(slotmap.get(key2))[1]));


    expect(2).toBe(slotmap.length());
    slotmap.remove(key1);
    expect(1).toBe(slotmap.length());
    expect("computer").toBe(extractOption(extractOption(slotmap.get(key2))[1]));
});


test(LABEL("iterate slotmap_3"), () => {
    type Label = string;
    type Digit = number;
    interface Point {
        x: number,
        y: number
    }
    const slotmap = create_slotmap_3<Label, Digit, Point>();

    slotmap.insert(["hello", 10, {x: 1, y: 2}]);
    slotmap.insert(["over", 20, {x: 3, y: 4}]);
    slotmap.insert(["there", 30, {x: 5, y: 6}]);

    const transposed:{
        labels: Array<Label>,
        digits: Array<Digit>,
        points: Array<Point>,
     } = {
        labels: [],
        digits: [],
        points: []
    };

    for(const value of slotmap.values) {
        const [label, digit, point] = value;
        transposed.labels.push(label);
        transposed.digits.push(digit);
        transposed.points.push(point);
    }

    expect(["hello","over","there"]).toEqual(transposed.labels);
    expect([10,20,30]).toEqual(transposed.digits);
    expect([{x: 1, y: 2}, {x: 3, y: 4}, {x: 5, y: 6}]).toEqual(transposed.points);
});


test(LABEL("iterate and mutate slotmap_3"), () => {
    type Label = string;
    type Digit = number;
    interface Point {
        x: number,
        y: number
    }
    const slotmap = create_slotmap_3<Label, Digit, Point>();

    slotmap.insert(["hello", 10, {x: 1, y: 2}]);
    slotmap.insert(["over", 20, {x: 3, y: 4}]);
    slotmap.insert(["there", 30, {x: 5, y: 6}]);

    Array.from(slotmap.values).forEach((value, idx) => {
        if(idx === 1) {
            value[2].x = 42;
        }
    });
    const transposed:{
        labels: Array<Label>,
        digits: Array<Digit>,
        points: Array<Point>,
     } = {
        labels: [],
        digits: [],
        points: []
    };

    for(const value of slotmap.values) {
        const [label, digit, point] = value;
        transposed.labels.push(label);
        transposed.digits.push(digit);
        transposed.points.push(point);
    }

    expect(["hello","over","there"]).toEqual(transposed.labels);
    expect([10,20,30]).toEqual(transposed.digits);
    expect([{x: 1, y: 2}, {x: 42, y: 4}, {x: 5, y: 6}]).toEqual(transposed.points);
});