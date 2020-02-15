import { expect } from 'chai';
import { flatten, unflatten } from '../src/lib/flat';
import deepEq from 'deep-equal';

describe('#flatten', () => {
  it('should flatten the given object', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: {
        e: 4,
        f: {},
        m: [],
        n: [5, '6'],
      },
      g: ['h', {}, [], { o: 7 }],
      i: undefined,
      j: null,
      k: false,
      p: true,
      l: 'lol',
    };

    expect(flatten(obj)).to.have.keys(
      'a', 'b', 'c', 'd.e', 'd.f', 'd.m', 'd.n.0', 'd.n.1', 'g.0', 'g.1', 'g.2', 'g.3.o', 'i', 'j', 'k', 'l', 'p',
    );

    expect(flatten(obj).a).to.be.eql(1);
    expect(flatten(obj).b).to.be.eql(2);
    expect(flatten(obj).c).to.be.eql(3);
    expect(flatten(obj)['d.e']).to.be.eql(4);
    expect(flatten(obj)['d.f']).to.be.eql('{}');
    expect(flatten(obj)['d.m']).to.be.eql('[]');
    expect(flatten(obj)['d.n.0']).to.be.eql(5);
    expect(flatten(obj)['d.n.1']).to.be.eql('6');
    expect(flatten(obj)['g.0']).to.be.eql('h');
    expect(flatten(obj)['g.1']).to.be.eql('{}');
    expect(flatten(obj)['g.2']).to.be.eql('[]');
    expect(flatten(obj)['g.3.o']).to.be.eql(7);
    expect(flatten(obj).i).to.be.eql('undefined');
    expect(flatten(obj).j).to.be.eql('null');
    expect(flatten(obj).k).to.be.eql('false');
    expect(flatten(obj).p).to.be.eql('true');
    expect(flatten(obj).l).to.be.eql('lol');
  });

  it('should flatten an empty object', () => {
    const obj = {
      a: {},
    };

    expect(flatten(obj)).to.have.keys('a');
    expect(flatten(obj).a).to.be.eql('{}');
  });
  it('should flatten an empty array', () => {
    const obj = {
      a: [],
    };

    expect(flatten(obj)).to.have.keys('a');
    expect(flatten(obj).a).to.be.eql('[]');
  });
  it('should flatten nested object', () => {
    const obj = {
      a: {
        b: 1,
      },
    };

    expect(flatten(obj)).to.have.keys('a.b');
    expect(flatten(obj)['a.b']).to.be.eql(1);
  });
  it('should flatten nested array', () => {
    const obj = {
      a: [[1]],
    };

    expect(flatten(obj)).to.have.keys('a.0.0');
    expect(flatten(obj)['a.0.0']).to.be.eql(1);
  });
  it('should flatten array within an object', () => {
    const obj = {
      a: {
        b: [],
        c: [1],
      },
    };

    expect(flatten(obj)).to.have.keys('a.b', 'a.c.0');
    expect(flatten(obj)['a.b']).to.be.eql('[]');
    expect(flatten(obj)['a.c.0']).to.be.eql(1);
  });
  it('should flatten object within an array', () => {
    const obj = {
      a: [{}, {b: 1}],
    };

    expect(flatten(obj)).to.have.keys('a.0', 'a.1.b');
    expect(flatten(obj)['a.0']).to.be.eql('{}');
    expect(flatten(obj)['a.1.b']).to.be.eql(1);
  });

  it('should flatten an empty root object', () => {
    const obj = {};

    expect(deepEq(flatten(obj), {})).to.be.true;
  });
});

describe('#unflatten', () => {
  it('should unflatten a given object', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
      },
      d: [3],
      e: '4',
      f: false,
      i: true,
      g: undefined,
      h: null,
    };

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should unflatten an empty object', () => {
    const obj = {
      a: 1,
      b: {},
    };

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should unflatten an empty array', () => {
    const obj = {
      a: 1,
      b: [],
    };

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should unflatten nested object', () => {
    const obj = {
      a: 1,
      b: {
        c: {
          d: 2,
        },
        e: {},
      },
    };

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should unflatten nested array', () => {
    const obj = {
      a: 1,
      b: [[], [1]],
    };

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should unflatten array within an object', () => {
    const obj = {
      a: 1,
      b: {
        c: [],
        d: [2],
      },
    };

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should unflastten object within an array', () => {
    const obj = {
      a: 1,
      b: [{}, {c: 2}],
    };

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should unflatten a root empty object', () => {
    const obj = {};

    const flattened = flatten(obj);
    const unflattened = unflatten(flattened);
    expect(deepEq(unflattened, obj)).to.be.true;
  });

  it('should not flatten / unflattern a Dot in the object property', () => {
    const obj = {
      'a.b': 'c',
    };

    const flattened = flatten(obj);
    expect(flattened['a/.b']).to.eql('c');

    const unflattened = unflatten(flattened);
    expect(unflattened['a.b']).to.be.eql('c');
  });
});
