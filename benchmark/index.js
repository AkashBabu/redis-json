import Benchmark from 'benchmark';
// import Lib from '../dist';

const suite = new Benchmark.Suite();
// const lib = new Lib();
const lib = 'stringtest';

// add tests
suite
.add('Lib#test1', () => {
    lib.test('Hello World!');
})
.add('Lib#test2', () => {
    lib.match('test');
})
// add listeners
.on('cycle', event => {
    console.log(String(event.target));
})
.on('complete', function () {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);
})
// run async
.run({ async: true });
