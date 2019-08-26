[![Build Status](https://travis-ci.org/dakom/slotmap.svg?branch=master)](https://travis-ci.org/dakom/slotmap)

Slotmap in Typescript

This was an experiment to see about building something like a multi-value SlotMap as the basis for an Entity Component System in Javascript/Typescript (just for experimental purposes)

It stops short of many things that would be required to tie them together, since I first wanted to see if aligning things with Arrays gave a performance boost (without relying on an unrealistic API).

See Results below :)

In terms of speed - the top priority is iteration over values. Less priority is given to insertion/removal

In terms of features - insert() gives a unique key (within the given slotmap) and can be used for lookups with zero conflicts (until the "generation/version" wraps... but that's a story for another time and isn't relevant to the test here)

There are API's for updating and getting in any order and iterating over the values and/or keys, as well as selectively culling the values to get only what's needed.

Basically - things can be thought of as a structure of arrays, or an array of structures, or a map of structures, and the API supports all of those (just like you can iterate over a native Map's values and destructure objects, or keys or do a lookup by key, but here we're storing things in arrays - and **only** Arrays + TypedArays, no objects or hashmaps anywhere!).

The maximum number of live keys it can hold is currently around 1MM.

Errors and missing values are expressed with [fp-ts](https://github.com/gcanti/fp-ts), so that's a peer dependency

Inspired by [beach_map](https://github.com/leudz/beach_map) and [EnTT](https://github.com/skypjack/entt)

(but doesn't go near as far as either of those in terms of features or performance)

# Results

When the slotmap is treated like a regular map, it's pretty much equal.

When the values are iterated like an ECS, it's _significantly_ better:

```
nativemap keys x 6,665 ops/sec ±0.41% (92 runs sampled)
slotmap keys x 6,787 ops/sec ±0.47% (94 runs sampled)
slotmap values x 10,760 ops/sec ±1.35% (93 runs sampled)
```

# Usage

See the tests and benchmark, as well as source :)

If you want to use the lib, for whatever reason, it is published to npm under `slotmap`
