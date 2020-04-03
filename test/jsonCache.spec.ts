import JSONCache from '../src/lib/jsonCache';
import IORedis from 'ioredis';
import Redis from 'redis';
import forEach from 'mocha-each';
import {promisify} from 'util';

const redisClient = Redis.createClient() as any;
const ioRedisClient = new IORedis({ dropBufferSupport: true }) as any;

import { expect } from 'chai';
import deepEq from 'deep-equal';
import delay from 'delay';

const PREFIX = 'jc:';

interface T {
  str?: string;
  num?: number;
  nested?: {
    inner: {
      str: string;
    };
  };
  address?: {
    doorNo?: string;
    locality?: string;
    pincode?: number;
    cars?: string[];
  };
  [otherProps: string]: any;
}

const testObj: T = {
  str: 'foo',
  num: 123,
  nested: {
    inner: {
      str: 'foo',
    },
  },
  address: {
    doorNo: '12B',
    locality: 'pentagon',
    pincode: 123456,
    cars: ['BMW 520i', 'Audo A8'],
  },
};

forEach([
  ['With IORedisClient', ioRedisClient],
  ['With RedisClient', redisClient],
])
.describe('#redis-json -> %s', (_, client: any) => {

  let jsonCache: JSONCache<T>;
  before(async () => {
    const multi = client.multi([['del', 'name']]);
    await multi.exec();
    jsonCache = new JSONCache(client, {
      prefix: PREFIX,
    });
  });

  // Clear only the prefixed keys
  beforeEach(() => jsonCache.clearAll());

  // Clear only the prefixed keys
  after(() => jsonCache.clearAll());

  it('should save json object without any error', async () => {
    await jsonCache.set('1', testObj);
  });

  it('should not replace other properties when set is used', async () => {
    const extra = { another: 'value' };
    await jsonCache.set('2', {
      str: 'blah',
    });
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

    await delay(1500);

    const response = await jsonCache.get('5');
    expect(response).to.not.exist;
  });

  it('should retrieve only the requested fields', async () => {
    await jsonCache.set('8', testObj);

    const keys = Object.keys(testObj).slice(0, 2);

    const retreived = await jsonCache.get('8', ...keys) as T;

    expect(Object.keys(retreived)).to.have.all.members(keys);

    keys.forEach(k => {
      expect(retreived[k] == testObj[k]).to.be.true;
    });
  });

  it('should be able to save and retreive empty object', async () => {
    await jsonCache.set('9', {
      foo: {},
    });

    const result = await jsonCache.get('9') as T;

    expect(result.foo).to.be.an('object');
    expect(Object.keys(result.foo)).to.be.of.length(0);
  });

  it('should be able to save and retreive empty array', async () => {
    await jsonCache.set('10', {
      foo: [],
    });

    const result = await jsonCache.get('10') as T;

    expect(result.foo).to.be.an('array');
    expect(result.foo).to.be.of.length(0);
  });

  it('should support prefix for the store object', async () => {
    const jc = new JSONCache<T>(client, {
      prefix: 'custom:',
    });

    const obj = { random: (Math.random() * 1000).toString() };
    await jc.set('6', obj);

    const redisData = await promisify(client.hgetall).bind(client)(`custom:6`);
    delete redisData.__jc_root__;

    expect(deepEq(redisData, obj)).to.be.true;
  });

  it('should consider `jc:` as the default prefix', async () => {
    const jc = new JSONCache<T>(client);

    const obj = { random: (Math.random() * 1000).toString() };
    await jc.set('8', obj);

    const redisData = await promisify(client.hgetall).bind(client)(`jc:8`);
    delete redisData.__jc_root__;

    expect(deepEq(redisData, obj)).to.be.true;
  });

  it('should remove all the keys on clearAll', async () => {
    const obj = { a: 1 };
    await jsonCache.set('7', obj);

    await jsonCache.clearAll();

    const keys = await promisify(client.keys).bind(client)(`${PREFIX}*`);
    expect(keys).to.have.length(0);

  });

  it('should return undefined when the requested key is not present in the cache', async () => {
    await jsonCache.clearAll();

    const result = await jsonCache.get('unknown');

    expect(result).to.be.undefined;
  });

  it('should support `.`(Dot) in object property', async () => {
    const obj = {
      'a': 1,
      'b.c': 'd',
      'e\.f': 'g',
    };

    await jsonCache.clearAll();

    await jsonCache.set('8', obj);
    const result = await jsonCache.get('8') as any;

    expect(result['b.c']).to.be.eq('d');
    expect(result['e\.f']).to.be.eq('g');
  });

  describe('#different input combinations', () => {

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
      b: [{}, { c: 2 }],
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
});
