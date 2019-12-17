import JSONCache from '../src/lib/jsonCache';
import Redis from 'ioredis';
const redis = new Redis({ dropBufferSupport: true }) as any;

import { expect } from 'chai';
import deepEq from 'deep-equal';
import delay from 'delay';
import { IObj } from '../src/lib/interfaces';

const PREFIX = 'jc:';

describe('#redis-json', () => {
  let jsonCache: JSONCache;
  before(async () => {
    const multi = redis.multi([['del', 'name']]);
    await multi.exec();
    jsonCache = new JSONCache(redis, {
      prefix: PREFIX,
    });
  });

  // Clear only the prefixed keys
  beforeEach(() => jsonCache.clearAll());

  // Clear only the prefixed keys
  after(() => jsonCache.clearAll());

  const tests = [{
    _id: 'asdf',
    ctime: '2018-12-08T16:44:24.981Z',
    name: 'test',
    empId: '123',
    pwd: 'ghjk',
    dob: '1991-11-01T00:00:00Z',
    role: 0,
    jtis: {
      jkl: {
        exp: 1544892291851,
      },
    },
    __v: 0,
  }, {
      name: 'redis-json',
      age: 25,
      address: {
        doorNo: '12B',
        locality: 'pentagon',
        pincode: 123456,
        cars: ['BMW 520i', 'Audo A8'],
      },
  }];

  tests.forEach((testObj) => {
      it('should save json object without any error', async () => {
        await jsonCache.set('1', testObj);
      });

      it('should not replace other properties when set is used', async () => {
        const extra = { another: 'value' };
        await jsonCache.set('2', extra);
        await jsonCache.set('2', testObj);

        const response = await jsonCache.get('2');
        expect(deepEq(response, Object.assign(testObj, extra)));
      });

      it('should retreive the JSON object in the same shape as was saved', async () => {
        await jsonCache.set('3', testObj);

        const response = await jsonCache.get('3');

        expect(deepEq(testObj, response)).to.be.true;
      });

      it('should replace the Object when rewrite is used', async () => {
        await jsonCache.set('4', Object.assign(testObj, { another: 'value' }));

        await jsonCache.rewrite('4', testObj);

        const response = await jsonCache.get('4');
        expect(deepEq(testObj, response)).to.be.true;
      });

      it('should expire the keys after the given expiry time', async () => {
        await jsonCache.set('5', Object.assign(testObj, { another: 'value' }), {
          expire: 1,
        });

        await delay(1010);

        const response = await jsonCache.get('5');
        expect(response).to.not.exist;
      });

      it('should retrieve only the requested fields', async () => {
        await jsonCache.set('8', testObj);

        const keys = Object.keys(testObj).slice(0, 2);

        const retreived = await jsonCache.get('8', ...keys) as IObj;

        expect(Object.keys(retreived)).to.have.all.members(keys);

        keys.forEach(k => {
          expect(retreived[k] == testObj[k]).to.be.true;
        });
      });

      it('should be able to save and retreive empty object', async () => {
        await jsonCache.set('9', {
          foo: {},
        });

        const result = await jsonCache.get('9') as IObj;

        expect(result.foo).to.be.an('object');
        expect(Object.keys(result.foo)).to.be.of.length(0);
      });

      it('should be able to save and retreive empty array', async () => {
        await jsonCache.set('10', {
          foo: [],
        });

        const result = await jsonCache.get('10') as IObj;

        expect(result.foo).to.be.an('array');
        expect(result.foo).to.be.of.length(0);
      });

    });

  it('should support prefix for the store object', async () => {
      const obj = { [(Math.random() * 100).toString()]: (Math.random() * 1000).toString() };
      await jsonCache.set('6', obj);

      const redisData = await redis.hgetall(`${PREFIX}6`);
      delete redisData.__jc_root__;

      expect(deepEq(redisData, obj)).to.be.true;
    });

  it('should remove all the keys on clearAll', async () => {
      const obj = { a: 1 };
      await jsonCache.set('7', obj);

      await jsonCache.clearAll();

      const keys = await redis.keys(`${PREFIX}*`);
      expect(keys).to.have.length(0);

    });

  it('should return undefined when the requested key is not present in the cache', async () => {
      await jsonCache.clearAll();

      const result = await jsonCache.get('unknown');

      expect(result).to.be.undefined;
    });

  const inputs = [{
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
    l: 'lol',
  }, {
    a: 1,
    b: {},
  }, {
    a: 1,
    b: [],
  }, {
    a: 1,
    b: {
      c: {
        d: 2,
      },
      e: {},
    },
  }, {
    a: 1,
    b: [[], [1]],
  }, {
    a: 1,
    b: {
      c: [],
      d: [2],
    },
  }, {
    a: 1,
    b: [{}, {c: 2}],
  }, {}];

  inputs.forEach((input, i) => {
    it(
      `should be able to save and retrieve the given object in the exact same shape for input: #${i}`,
      async () => {
      await jsonCache.set('sameShape', input);

      const output = await jsonCache.get('sameShape');

      expect(deepEq(output, input), `failed to match: \n\texpect: ${JSON.stringify(input, null, 2)}, \n\tactual: ${JSON.stringify(output, null, 2)}`).to.be.true;
    });
  });
});
