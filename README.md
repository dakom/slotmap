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

**Success!**

When the values are iterated like an ECS, it's _significantly_ better, like 2x better

When the slotmap is treated like a regular map, it's pretty much equal (actually it's faster - but not by as wide a margin)


**100 entries:**
```
running benchmark for 100 entries

nativemap keys x 5,015 ops/sec ±0.38% (95 runs sampled)
slotmap keys x 6,182 ops/sec ±1.15% (92 runs sampled)
nativemap values x 6,131 ops/sec ±1.90% (93 runs sampled)
slotmap values x 10,448 ops/sec ±0.87% (90 runs sampled)

Fastest is slotmap values
```

**1000 entries:**
```
nativemap keys x 397 ops/sec ±2.75% (87 runs sampled)
slotmap keys x 539 ops/sec ±0.74% (93 runs sampled)
nativemap values x 599 ops/sec ±0.46% (91 runs sampled)
slotmap values x 1,021 ops/sec ±3.11% (89 runs sampled)

Fastest is slotmap values
```

# Usage

The benchmark has examples, as well as tests - and source has the interface defined at the top of slotmap.ts :)

If you want to use the lib, for whatever reason, it is published to npm under `slotmap`

# TODO

This could be taken to the next level for a proper ECS with a few changes:

1. Solve the problem of version expiring when add/remove in a tight loop (use beach_map approach instead of EnTT)
2. Have different slotmaps indexed by the same keys
3. Ability to add/remove the components, not the entire entry (e.g. by adding/removing on those different slotmaps)