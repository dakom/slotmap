[![Build Status](https://travis-ci.org/dakom/slotmap.svg?branch=master)](https://travis-ci.org/dakom/slotmap)

Slotmap in Typescript

insert() gives you absolutely unique keys (within the system), and iteration over values is _fast_

Errors and missing values are expressed with [fp-ts](https://github.com/gcanti/fp-ts), so that's a peer dependency

Inspired by [beach_map](https://github.com/leudz/beach_map) and [EnTT](https://github.com/skypjack/entt)

# Installation

`npm install --save slotmap fp-ts`

# Usage

First, create a slotmap:
```
const slotmap = create_slotmap()
```

If you want the type system to ensure that all values are the same type, supply it:

```
const slotmap = create_slotmap<string>()
```

Once you have your slotmap, use the following methods on it (`V` is the type parameter mentioned above. It can also be `any`):

**insert: (value:V) => Key**

&nbsp;&nbsp;&nbsp;&nbsp;Insert a value, get a unique Key back (which can be used to remove or get the value later)

**remove: (key:Key) => Either<ErrorKind, void>**

&nbsp;&nbsp;&nbsp;&nbsp;Remove a key/value

**get: (key:Key) => Option<V>**

&nbsp;&nbsp;&nbsp;&nbsp;Get a value by providing the Key

**values: () => Readonly<Array<V>>**

&nbsp;&nbsp;&nbsp;&nbsp;Get an array of values

**keys: () => Readonly<Array<Key>>**

&nbsp;&nbsp;&nbsp;&nbsp;Get an array of keys 

**entries: () => Readonly<Array<[Key,V]>>**

&nbsp;&nbsp;&nbsp;&nbsp;Get an array of key/value pairs