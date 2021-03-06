[![Build Status](https://travis-ci.org/dakom/slotmap.svg?branch=master)](https://travis-ci.org/dakom/slotmap)

Slotmap in Typescript

This was an experiment to see about building something like a multi-value SlotMap as the basis for an Entity Component System in Javascript/Typescript (just for experimental purposes)

It stops short of many things that would be required to tie them together, since this was mainly an experiment to see if aligning things with Arrays gave a performance boost (without relying on an unrealistic API).

Inspired by [beach_map](https://github.com/leudz/beach_map) and [EnTT](https://github.com/skypjack/entt)

(but doesn't go near as far as either of those in terms of features or performance)

**UPDATE: this experiment is taken to the next step in [partzuf](https://github.com/dakom/partzuf)**

# Results

**Success!**

When the values are iterated like an ECS, it's _significantly_ better, like 2x better

When the slotmap is treated like a regular map, it's pretty much equal (actually it's faster - but not by as wide a margin)


**100 entries:**
```
nativemap keys x 5,018 ops/sec ±0.50% (95 runs sampled)
slotmap keys x 5,973 ops/sec ±0.72% (94 runs sampled)
nativemap values x 6,276 ops/sec ±0.40% (93 runs sampled)
slotmap values x 10,678 ops/sec ±1.32% (94 runs sampled)

Fastest is slotmap values
```

**1000 entries:**
```
nativemap keys x 402 ops/sec ±2.51% (88 runs sampled)
slotmap keys x 480 ops/sec ±0.87% (90 runs sampled)
nativemap values x 610 ops/sec ±0.49% (93 runs sampled)
slotmap values x 1,033 ops/sec ±3.10% (89 runs sampled)

Fastest is slotmap values
```

# Usage 

The benchmark has examples, as well as tests - and source has the interface defined at the top of slotmap.ts :)

There's technically a typedoc generated via `npm run doc` but... meh

If you want to use the lib, for whatever reason, it is published to npm under `slotmap`

# Design choices

Basically - things can be thought of as a structure of arrays, or an array of structures, or a map of structures, and the API supports all of those (just like you can iterate over a native Map's values and destructure objects, or keys or do a lookup by key, but here we're storing things in arrays - and **only** Arrays + TypedArays, no objects or hashmaps anywhere!).

In terms of speed - the top priority is iteration over values. Less priority is given to insertion and even less to removal.

In terms of features - insert() gives a unique key (within the given slotmap) and can be used for lookups with zero conflicts (until the "generation/version" wraps... but that's a story for another time and isn't relevant to the test here)

There are API's for iterating in a few different ways that fit real-world needs - as well as selectively culling the values and operating over single entries.

Some things are not caught by Typescript. Sorry. The internals are tested and there is a decent amount of type information that makes it through.

The maximum number of live keys it can hold is currently around 1MM.

Errors and missing values are expressed with [fp-ts](https://github.com/gcanti/fp-ts), so that's a peer dependency

# TODO

This could be taken to the next level for a proper ECS with a few changes:

1. Solve the problem of version expiring when add/remove in a tight loop (use beach_map approach instead of EnTT)
2. Have different slotmaps indexed by the same keys
3. Ability to add/remove the components, not the entire entry (e.g. by adding/removing on those different slotmaps)
4. Typescript improvements