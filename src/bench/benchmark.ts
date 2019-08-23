/*import Benchmark from "benchmark";
import {create_slotmap, MAX_ID} from "../lib/lib";

const suite_1= new Benchmark.Suite;
const slotmap_1 = create_slotmap();
const nativemap_1 = new Map();


// add tests
suite_1
.add('Slotmap insert+remove', function() {
    const key = slotmap_1.insert("hello");
    slotmap_1.remove(key);
})
.add('Native map insert+remove', function() {
    const key = Symbol();
    nativemap_1.set(key, "hello");
    nativemap_1.delete(key);
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run();


const suite_1b= new Benchmark.Suite;
const slotmap_1b = create_slotmap(MAX_ID);
const nativemap_1b = new Map();


// add tests
suite_1b
.add('Slotmap insert+remove (prealloc)', function() {
    const key = slotmap_1b.insert("hello");
    slotmap_1b.remove(key);
})
.add('Native map insert+remove', function() {
    const key = Symbol();
    nativemap_1b.set(key, "hello");
    nativemap_1b.delete(key);
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run();


//.run({ 'async': true });

const suite_2= new Benchmark.Suite;
const slotmap_2 = create_slotmap<string>();
const nativemap_2 = new Map();

//Populate with a bunch of values... fragment a little bit with one removal
for(let i = 0; i < 1000; i++) {
  const value = "hello_" + i;
 
  const key1 = slotmap_2.insert(value);
  slotmap_2.remove(key1);

  const key2 = Symbol();
  nativemap_2.set(key2, value);
  nativemap_2.delete(key2);


  slotmap_2.insert(value);

  const key3 = Symbol();
  nativemap_2.set(key3, value);
}


suite_2
.add('Slotmap iterate', function() {

    const values = slotmap_2.values();
    for(const value of values) {
        const foo = value + " world!";
    }
})
.add('Native map iterate', function() {
    const values = nativemap_2.values();
    for(const value of values) {
        const foo = value + " world!";
    }
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));

})
.run();


const suite_3= new Benchmark.Suite;
const slotmap_3 = create_slotmap<string>();
const nativemap_3 = new Map();
suite_3
.add('Slotmap insert', function() {

    if(slotmap_3.values().length < MAX_ID) {
        const key = slotmap_3.insert("hello");
    }
})
.add('Native map insert', function() {
    if(nativemap_3.size < MAX_ID) {
        const key = Symbol();
        nativemap_3.set(key, "hello");
    }
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));

})
.run();
//.run({ 'async': true });


const suite_3b= new Benchmark.Suite;
const slotmap_3b = create_slotmap<string>(MAX_ID);
const nativemap_3b = new Map();
suite_3b
.add('Slotmap insert (prealloc)', function() {

    if(slotmap_3b.values().length < MAX_ID) {
        const key = slotmap_3b.insert("hello");
    }
})
.add('Native map insert', function() {
    if(nativemap_3b.size < MAX_ID) {
        const key = Symbol();
        nativemap_3b.set(key, "hello");
    }
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));

})
.run();
*/