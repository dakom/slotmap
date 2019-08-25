[![Build Status](https://travis-ci.org/dakom/slotmap.svg?branch=master)](https://travis-ci.org/dakom/slotmap)

Slotmap in Typescript

This was an experiment to see about building a SlotMap as the basis for an Entity Component System in Javascript/Typescript 

In terms of speed - the top priority is iteration over values. Less priority is given to insertion/removal

In terms of features - insert() gives a unique key (within the given slotmap) and can be used for lookups with zero conflicts
There are API's for updating and getting in any order and iterating over the values and/or keys

The maximum number of live values a slotmap can hold is currently around 1MM.

Errors and missing values are expressed with [fp-ts](https://github.com/gcanti/fp-ts), so that's a peer dependency

Inspired by [beach_map](https://github.com/leudz/beach_map) and [EnTT](https://github.com/skypjack/entt)

# Results

In a word: **fail**

Using a native Map and updating values arbitrarily is faster (not by much - but still, it's faster)

I'm not sure why... maybe I messed something up, but I think ultimately it's because JS Arrays aren't really arrays

At least not in the sense of "data oriented" programming. We have no control over their alignment or allocation.

In other words, if pushing to an array doesn't actually put the data next to the previous one in memory, then it might as well be anywhere and the cost we incur by maintaining an indirect lookup slows things down compared to just getting at it via a Map.

Most likely JS arrays can't keep things aligned, since JS has no type information - in other words, we know an Array is only numbers, but JS has to assume the Array can hold anything...

However - from another perspective, an experiment is only really a failure if we learn nothing from it. Assuming the results here are accurate - there's actually a **huge** lesson to be learned here. JS has a ceiling for how well it can be optimized on the app side. Not only does the garbage collector have an impact, but the dynamic typing means we're at the mercy of "support all the things" and can't do better than that. 

# Usage

See the tests and benchmark, as well as source :)

If you want to use the lib, for whatever reason, it is published to npm under `slotmap`
