import { expect } from 'chai';
import { Flattener } from '../../src/lib/flattener';
import deepEq from 'deep-equal';

describe('#flattener', () => {

  describe('#flatten', () => {
    it('should be able to flatten empty object', () => {
      const flattener = new Flattener();

      const testObj = {};

      const expectObj = {
        '': '{}',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten empty array', () => {
      const flattener = new Flattener();

      const testObj = [];

      const expectObj = {
        '': '[]',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an object', () => {
      const flattener = new Flattener();

      const testObj = { a: 1 };

      const expectObj = {
        a: '1',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array', () => {
      const flattener = new Flattener();

      const testObj = [1, 2];

      const expectObj = {
        0: '1',
        1: '2',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });

    it('should be able to flatten object of string->number', () => {
      const flattener = new Flattener();

      const testObj = {
        a: 1,
      };

      const expectObj = {
        a: '1',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->string', () => {
      const flattener = new Flattener();

      const testObj = {
        a: 'a',
      };

      const expectObj = {
        a: 'a',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->boolean', () => {
      const flattener = new Flattener();

      const testObj = {
        a: true,
        b: false,
      };

      const expectObj = {
        a: 'true',
        b: 'false',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->undefined', () => {
      const flattener = new Flattener();

      const testObj = {
        a: undefined,
      };

      const expectObj = {
        a: 'undefined',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->null', () => {
      const flattener = new Flattener();

      const testObj = {
        a: null,
      };

      const expectObj = {
        a: 'null',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->empty object', () => {
      const flattener = new Flattener();

      const testObj = {
        a: {},
      };

      const expectObj = {
        a: '{}',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->object', () => {
      const flattener = new Flattener();

      const testObj = {
        a: {
          b: 1,
        },
      };

      const expectObj = {
        'a.b': '1',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->array', () => {
      const flattener = new Flattener();

      const testObj = {
        a: [],
      };

      const expectObj = {
        a: '[]',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->empty arrays', () => {
      const flattener = new Flattener();

      const testObj = {
        a: [1, 2],
      };

      const expectObj = {
        'a.0': '1',
        'a.1': '2',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->custom class w/o stringifier', () => {
      const flattener = new Flattener();

      const date = new Date();
      const testObj = {
        a: date,
      };

      const expectObj = {
        a: String(date),
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten object of string->custom class w/ stringifier', () => {
      const flattener = new Flattener({
        Date: (val: Date) => val.toISOString(),
      });

      const date = new Date();
      const testObj = {
        a: date,
      };

      const expectObj = {
        a: date.toISOString(),
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });

    it('should be able to flatten an array of numbers', () => {
      const flattener = new Flattener();

      const testObj = [1];

      const expectObj = {
        0: '1',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of string', () => {
      const flattener = new Flattener();

      const testObj = ['1'];

      const expectObj = {
        0: '1',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of boolean', () => {
      const flattener = new Flattener();

      const testObj = [true, false];

      const expectObj = {
        0: 'true',
        1: 'false',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of null', () => {
      const flattener = new Flattener();

      const testObj = [null];

      const expectObj = {
        0: 'null',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of undefined', () => {
      const flattener = new Flattener();

      const testObj = [undefined];

      const expectObj = {
        0: 'undefined',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of inner empty arrays', () => {
      const flattener = new Flattener();

      const testObj = [[]];

      const expectObj = {
        0: '[]',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of inner arrays', () => {
      const flattener = new Flattener();

      const testObj = [[1, '1', false, true, null, undefined]];

      const expectObj = {
        '0.0': '1',
        '0.1': '1',
        '0.2': 'false',
        '0.3': 'true',
        '0.4': 'null',
        '0.5': 'undefined',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of inner empty object', () => {
      const flattener = new Flattener();

      const testObj = [{}];

      const expectObj = {
        0: '{}',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of inner object', () => {
      const flattener = new Flattener();

      const testObj = [{ a: 1 }];

      const expectObj = {
        '0.a': '1',
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of custom class w/o stringifier', () => {
      const flattener = new Flattener();

      const date = new Date();
      const testObj = [date];

      const expectObj = {
        0: String(date),
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
    it('should be able to flatten an array of custom class w/ stringifier', () => {
      const flattener = new Flattener({
        Date: (val: Date) => val.toISOString(),
      });

      const date = new Date();
      const testObj = [date];

      const expectObj = {
        0: date.toISOString(),
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });

    it('should allow . in key name', () => {
      const flattener = new Flattener();

      const testObj = {
        'a.b': 1,
      };

      const expectObj = {
        'a/.b': 1,
      };

      expect(deepEq(flattener.flatten(testObj).data, expectObj)).to.be.true;
    });
  });

  describe('#unflatten', () => {
    it('should unflatten empty object', () => {
      const flattener = new Flattener();

      const testObj = {};

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten empty array', () => {
      const flattener = new Flattener();

      const testObj = [];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an object', () => {
      const flattener = new Flattener();

      const testObj = { a: 1 };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array', () => {
      const flattener = new Flattener();

      const testObj = [1, 2];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });

    it('should unflatten object of string->number', () => {
      const flattener = new Flattener();

      const testObj = {
        a: 1,
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->string', () => {
      const flattener = new Flattener();

      const testObj = {
        a: 'a',
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->boolean', () => {
      const flattener = new Flattener();

      const testObj = {
        a: true,
        b: false,
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->undefined', () => {
      const flattener = new Flattener();

      const testObj = {
        a: undefined,
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->null', () => {
      const flattener = new Flattener();

      const testObj = {
        a: null,
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->empty object', () => {
      const flattener = new Flattener();

      const testObj = {
        a: {},
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->object', () => {
      const flattener = new Flattener();

      const testObj = {
        a: {
          b: 1,
        },
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->array', () => {
      const flattener = new Flattener();

      const testObj = {
        a: [],
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->empty arrays', () => {
      const flattener = new Flattener();

      const testObj = {
        a: [1, 2],
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten object of string->custom class w/ stringifier parser', () => {
      const flattener = new Flattener({
        Date: (val: Date) => val.toISOString(),
      }, {
        Date: str => new Date(str),
      });

      const date = new Date();
      const testObj = {
        a: date,
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });

    it('should unflatten an array of numbers', () => {
      const flattener = new Flattener();

      const testObj = [1];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of string', () => {
      const flattener = new Flattener();

      const testObj = ['1'];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of boolean', () => {
      const flattener = new Flattener();

      const testObj = [true, false];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of null', () => {
      const flattener = new Flattener();

      const testObj = [null];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of undefined', () => {
      const flattener = new Flattener();

      const testObj = [undefined];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of inner empty arrays', () => {
      const flattener = new Flattener();

      const testObj = [[]];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of inner arrays', () => {
      const flattener = new Flattener();

      const testObj = [[1, '1', false, true, null, undefined]];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of inner empty object', () => {
      const flattener = new Flattener();

      const testObj = [{}];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of inner object', () => {
      const flattener = new Flattener();

      const testObj = [{ a: 1 }];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
    it('should unflatten an array of custom class w/ stringifier, parser', () => {
      const flattener = new Flattener({
        Date: (val: Date) => val.toISOString(),
      }, {
        Date: str => new Date(str),
      });

      const date = new Date();
      const testObj = [date];

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });

    it('should allow . in key name', () => {
      const flattener = new Flattener();

      const testObj = {
        'a.b': 1,
      };

      expect(deepEq(flattener.unflatten(flattener.flatten(testObj)), testObj, {
        strict: true,
      })).to.be.true;
    });
  });

  describe('#integrated test', () => {
    it('should return string data and the associated typeInfo when flattened', () => {
      const flattener = new Flattener({
        Date: (val: Date) => val.toISOString(),
      });

      const testObj = {
        a: 1,
        b: '1',
        c: false,
        d: true,
        e: null,
        f: undefined,
        g: Symbol('bar'),
        h: '{}',
        i: '[]',
        j: 'null',
        k: 'undefined',
        l: {
          a: 1,
          b: '1',
          c: false,
          d: true,
          e: null,
          f: undefined,
          g: Symbol('bar'),
          h: '{}',
          i: '[]',
          j: 'null',
          k: 'undefined',
          l: {
            m: 1,
            n: [1, 2, { a: 1 }, [], [1, 2], [1, '2', true, false, null, undefined, { a: 1 }]],
          },
          m: {},
          n: [],
        },
        m: [],
        n: [1, 2, { a: 1 }, [], [1, 2], [1, '2', true, false, null, undefined, { a: 1 }]],
        o: {},
        p: new Date(),
      };

      const unflattened = flattener.unflatten(flattener.flatten(testObj));

      // deleting Symbols as it is not expected to be stored
      delete testObj.g;
      delete testObj.l.g;

      // deleting custom class as it points to a reference
      delete testObj.p;
      delete unflattened.p;

      expect(deepEq(testObj, unflattened, {
        strict: true,
      })).to.be.true;

    });
  });
});
