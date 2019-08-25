[![Build Status](https://travis-ci.org/dakom/slotmap.svg?branch=master)](https://travis-ci.org/dakom/slotmap)

Slotmap in Typescript

This was an experiment to see about building something like a multi-value SlotMap as the basis for an Entity Component System in Javascript/Typescript (just for experimental purposes)

It stops short of many things that would be required to tie them together, since I first wanted to see if aligning things with Arrays gave a performance boost (without relying on an unrealistic API).

See Results below :)

In terms of speed - the top priority is iteration over values. Less priority is given to insertion/removal

In terms of features - insert() gives a unique key (within the given slotmap) and can be used for lookups with zero conflicts

There are API's for updating and getting in any order and iterating over the values and/or keys

Basically - things can be thought of as a structure of arrays, or an array of structures, or a map of structures.

The maximum number of live keys it can hold is currently around 1MM.

Errors and missing values are expressed with [fp-ts](https://github.com/gcanti/fp-ts), so that's a peer dependency

Inspired by [beach_map](https://github.com/leudz/beach_map) and [EnTT](https://github.com/skypjack/entt)

(but doesn't go near as far as either of those in terms of features)

# Results

In a word: **fail**

OK technically it's a success - but using a native Map and updating values arbitrarily is only _slightly_ slower, they are essentially equal. I'd expect it to be a much bigger difference

I'm not sure why... maybe I messed something up, but I am _guessing_ that ultimately it's because JS Arrays aren't really arrays

At least not in the sense of "data oriented" programming. We have no control over their alignment or allocation.

If pushing to an array doesn't actually put the data next to the previous one in memory, then it might as well be anywhere. If we can't pre-allocate for our data, it'll be similarly fragmented or slow.

JS has no type information - sure, we know an Array is only strings of a certain length or specific objects or whatever, but JS has to assume the Array can hold anything... so it's limited in what it can do.

From another perspective, an experiment is only really a failure if we learn nothing from it. Assuming the results here are accurate - there's actually a **huge** lesson to be learned here. JS has a ceiling for how well it can be optimized on the app side. Not only does the garbage collector have an impact, but the dynamic typing means we're at the mercy of "support all the things" and can't do better than that when it comes to optimizing for memory alignment in our JS code.

# Usage

See the tests and benchmark, as well as source :)

If you want to use the lib, for whatever reason, it is published to npm under `slotmap`
