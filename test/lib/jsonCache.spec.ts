import JSONCache from '../../src/lib/jsonCache';
import IORedis from 'ioredis';
import Redis from 'redis';
import forEach from 'mocha-each';
import { promisify } from 'util';
import { expect } from 'chai';
import deepEq from 'deep-equal';
import delay from 'delay';

const redisClient = Redis.createClient();
const ioRedisClient = new IORedis({ dropBufferSupport: true });
const PREFIX = 'jc:';

interface T {
  str: string;
  num: number;
  nested: Partial<{
    inner: {
      str: string;
    };
  }>;
  address: Partial<{
    doorNo: string;
    locality: string;
    pincode: number;
    cars: string[];
  }>;
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

    let jsonCache: JSONCache<Partial<T>>;
    before(async () => {
      const multi = client.multi([['del', 'name']]);
      await multi.exec();
      jsonCache = new JSONCache(client, {
        prefix: PREFIX,
      });
    });

    // Clear only the prefixed keys
    beforeEach(async () => await jsonCache.clearAll());

    // Clear only the prefixed keys
    after(async () => await jsonCache.clearAll());

    describe('constructor()', () => {
      it('should support prefix for the store object', async () => {
        const jc = new JSONCache<T>(client, {
          prefix: 'custom:',
        });

        const obj = { random: (Math.random() * 1000).toString() };
        await jc.set('test', obj as any);

        const redisData = await promisify(client.hgetall).bind(client)(`custom:test`);
        delete redisData.__jc_root__;

        expect(deepEq(redisData, obj)).to.be.true;

        await jc.clearAll();
      });

      it('should consider `jc:` as the default prefix', async () => {
        const jc = new JSONCache<T>(client);

        const obj = { random: (Math.random() * 1000).toString() };
        await jc.set('test', obj as any);

        const redisData = await promisify(client.hgetall).bind(client)(`jc:test`);
        delete redisData.__jc_root__;

        expect(deepEq(redisData, obj)).to.be.true;
      });

      it('should accept custom stringifier and parser for custom class', async () => {
        const jc = new JSONCache(client, {
          stringifier: {
            Date: (val: Date) => val.toISOString(),
          },
          parser: {
            Date: (str: string) => new Date(str),
          },
        });

        const obj = {
          date: new Date(),
        };

        await jc.set('test', obj);

        const result = await jc.get('test');
        expect(deepEq(result, obj)).to.be.true;
      });
    });

    describe('.set()', () => {
      it('should save json object without any error', async () => {
        await jsonCache.set('test', testObj);
      });

      it('should not replace other properties when set is used', async () => {
        const extra = { another: 'value' };
        await jsonCache.set('test', {
          str: 'blah',
        });
        await jsonCache.set('test', testObj);

        const response = await jsonCache.get('test');
        expect(deepEq(response, Object.assign(testObj, extra)));
      });

      it('should expire the keys after the given expiry time', async () => {
        await jsonCache.set('test', Object.assign(testObj, { another: 'value' }), {
          expire: 1,
        });

        await delay(1100);

        const response = await jsonCache.get('test');
        expect(response).to.not.exist;
      });

      it('should be able to save and retreive empty object', async () => {
        await jsonCache.set('test', {
          foo: {},
        });

        const result = await jsonCache.get('test') as T;

        expect(result.foo).to.be.an('object');
        expect(Object.keys(result.foo)).to.be.of.length(0);
      });

      it('should be able to save and retreive empty array', async () => {
        await jsonCache.set('test', {
          foo: [],
        });

        const result = await jsonCache.get('test') as T;

        expect(result.foo).to.be.an('array');
        expect(result.foo).to.be.of.length(0);
      });

      it('should override the existing field values', async () => {
        await jsonCache.set('test', {
          str: 'blah',
          num: 1,
          bool: true,
        });
        await jsonCache.set('test', {
          str: 'foo',
          num: 2,
        });

        const response = await jsonCache.get('test');
        expect(response?.str).to.be.eql('foo');
        expect(response?.num).to.be.eql(2);
        expect((response as any).bool).to.be.eql(true);
      });

      it('should add new field values', async () => {
        await jsonCache.set('test', {
          str: 'blah',
          num: 1,
          bool: true,
        });
        await jsonCache.set('test', {
          newField: 'foo',
        });

        const response = await jsonCache.get('test');
        expect(response?.str).to.be.eql('blah');
        expect(response?.num).to.be.eql(1);
        expect((response as any).bool).to.be.eql(true);
        expect((response as any).newField).to.be.eql('foo');
      });

      it('should accept arrays as root element', async () => {
        await jsonCache.set('test', [1, 2]);

        const response = await jsonCache.get('test');
        expect(response).to.be.an('array');
        expect(response?.length).to.be.eql(2);
        expect((response as any)[0]).to.be.eq(1)
        expect((response as any)[1]).to.be.eq(2)
      })

      it('should replace entire array as root element', async () => {
        await jsonCache.set('test', [1, 2]);

        let response = await jsonCache.get('test');
        expect(response).to.be.an('array');
        expect(response?.length).to.be.eql(2);
        expect((response as any)[0]).to.be.eq(1)
        expect((response as any)[1]).to.be.eq(2)

        await jsonCache.set('test', [3]);

        response = await jsonCache.get('test');
        expect(response).to.be.an('array');
        expect(response?.length).to.be.eql(1);
        expect((response as any)[0]).to.be.eq(3)
      })

      it('should replace entire array even when nested', async () => {
        await jsonCache.set('test', {
          foo: [1, 2, 3, 4]
        });

        let response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [1, 2, 3, 4]
        })).to.be.true;

        await jsonCache.set('test', {
          foo: [5, 6]
        });

        response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [5, 6]
        })).to.be.true;
      })

      it('should replace entire array even when nested', async () => {
        await jsonCache.set('test', {
          foo: [1, 2, 3, 4],
          bar: {
            baz: [1, {a: 'b'}, 'testing']
          }
        });

        let response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [1, 2, 3, 4],
          bar: {
            baz: [1, {a: 'b'}, 'testing']
          }
        })).to.be.true;

        await jsonCache.set('test', {
          foo: [5, 6],
          bar: {
            baz: [3,4,5]
          }
        });

        response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [5, 6],
          bar: {
            baz: [3,4,5]
          }
        })).to.be.true;
      })

      it('should only replace the entire array in the specified path', async () => {
        await jsonCache.set('test', {
          foo: [1, 2, 3, 4],
          bar: {
            baz: [5,6,7]
          }
        });

        let response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [1, 2, 3, 4],
          bar: {
            baz: [5,6,7]
          }
        })).to.be.true;

        await jsonCache.set('test', {
          bar: {
            baz: [8,9]
          }
        });

        response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [1, 2, 3, 4],
          bar: {
            baz: [8,9]
          }
        })).to.be.true;
      })

      it('should be possible to replace multiple nested array in the same command', async () => {
        await jsonCache.set('test', {
          foo: [1, 2, 3, 4],
          bar: [7,8],
        });

        let response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [1, 2, 3, 4],
          bar: [7,8],
        })).to.be.true;

        await jsonCache.set('test', {
          foo: [5, 6],
          bar: [10, 11]
        });

        response = await jsonCache.get('test');
        expect(deepEq(response, {
          foo: [5, 6],
          bar: [10, 11]
        })).to.be.true;
      })
    });

    describe('.get()', () => {
      it('should retreive the JSON object in the same shape as was saved', async () => {
        await jsonCache.set('test', testObj);

        const response = await jsonCache.get('test');

        expect(deepEq(testObj, response)).to.be.true;
      });

      it('should retrieve only the requested fields', async () => {
        await jsonCache.set('test', testObj);

        const keys = ['str', 'num'];

        const retreived = await jsonCache.get('test', ...keys) as T;

        expect(Object.keys(retreived)).to.have.all.members(keys);

        keys.forEach(k => {
          expect(retreived[k] === testObj[k]).to.be.true;
        });
      });

      it('should return undefined when the requested key is not present in the cache', async () => {
        const result = await jsonCache.get('unknown');

        expect(result).to.be.undefined;
      });

      it('should support `.`(Dot) in object property', async () => {
        const obj = {
          'a': 1,
          'b.c': 'd',
          'e/.f': 'g',
        };

        await jsonCache.set('test', obj);
        const result = await jsonCache.get('test') as any;

        expect(result['b.c']).to.be.eq('d');
        expect(result['e/.f']).to.be.eq('g');
      });

      it('should be able to save and retrieve an array', async () => {
        const arr = [
          {
            id: 1,
            name: 'John',
            age: 22,
          },
          {
            id: 2,
            name: 'James',
            age: 24,
          },
        ];

        await jsonCache.set('test', arr);
        const result = await jsonCache.get('test') as any;
        expect(result).to.be.an('array');
        expect(deepEq(result, arr)).to.be.true;
      });

      it('should retrieve only the requested inner fields', async () => {
        const obj = {
          a: {
            b: 1,
            c: '2',
          },
          d: false,
          e: true,
          f: [1, 2],
        };

        const filteredObj = {
          a: {
            b: 1,
          },
          d: false,
          f: [1, 2],
        };

        await jsonCache.set('test', obj);

        const result = await jsonCache.get('test', 'a.b', 'd', 'f');

        expect(deepEq(result, filteredObj, { strict: true })).to.be.true;
      });
    });

    describe('.clearAll()', () => {

      it('should remove all the keys on clearAll', async () => {
        const obj = { a: 1 };
        await jsonCache.set('test', obj);

        await jsonCache.clearAll();

        const keys = await promisify(client.keys).bind(client)(`${PREFIX}*`);
        expect(keys).to.have.length(0);

      });

      it('should clearAll the given keys in batches by scanning through the DB', async () => {
        const promises: Array<Promise<any>> = [];
        for (let i = 0; i < 1000; i++) {
          promises.push(jsonCache.set('test' + i, { str: '' }));
        }

        await Promise.all(promises);

        await jsonCache.clearAll();

        const keys = await promisify(client.keys).bind(client)(`${PREFIX}*`);
        expect(keys).to.have.length(0);
      });

    });

    describe('.rewrite()', () => {
      it('should replace the Object when rewrite is used', async () => {
        await jsonCache.set('test', Object.assign(testObj, { another: 'value' }));

        await jsonCache.rewrite('test', testObj);

        const response = await jsonCache.get('test');
        expect(deepEq(testObj, response)).to.be.true;
      });
    });

    describe('.del()', () => {
      it('should remove the given key from cache', async () => {
        await jsonCache.set('test', testObj);

        let result = await jsonCache.get('test');
        expect(deepEq(result, testObj)).to.be.true;

        await jsonCache.del('test');
        result = await jsonCache.get('test');
        expect(result).to.be.undefined;
      });
      it('should not remove any other keys in the cache', async () => {
        await jsonCache.set('test', {name: 'test'});
        await jsonCache.set('test1', {name: 'test1'});

        await jsonCache.del('test');
        const result = await jsonCache.get('test');
        expect(result).to.be.undefined;
        const result1 = await jsonCache.get('test1');
        expect(deepEq(result1, {name: 'test1'})).to.be.true;
      });
    });

    describe('.incr()', () => {
      it('should increment the value by the given amount', async () => {
        const obj = {
          messages: 10,
          profile: {
            name: 'testing',
            age: 25,
            rand: [1, 2, 3],
          },
        };

        const jc = new JSONCache<typeof obj>(client);

        await jc.set('test', obj);

        let test = await jc.get('test');
        expect(deepEq(test, obj)).to.be.true;

        await jc.incr('test', {messages: 1});
        test = await jc.get('test');
        expect(test?.messages).to.be.eql(11);
      });
      it('should accept nested path',  async () => {
        const jc = new JSONCache<{
          messages: number;
          profile: {
            name: string;
            age: number;
            rand: number[];
          }
        }>(client);

        const obj = {
          messages: 10,
          profile: {
            name: 'testing',
            age: 25,
            rand: [1, 2, 3],
          },
        };
        await jc.set('test', obj);

        let test = await jc.get('test');
        expect(deepEq(test, obj)).to.be.true;

        await jc.incr('test', {profile: {age: 1}});
        test = await jc.get('test');
        expect(test?.profile?.age).to.be.eql(26);
      });
      it('should accept partial nested object even if it includes a key with complete path',  async () => {
        const jc = new JSONCache<{
          messages: number;
          profile: {
            name: string;
            age: number;
            rand: number[];
          }
        }>(client);

        const obj = {
          messages: 10,
          profile: {
            name: 'testing',
            age: 25,
            rand: [1, 2, 3],
          },
        };
        await jc.set('test', obj);

        let test = await jc.get('test');
        expect(deepEq(test, obj)).to.be.true;

        await jc.incr('test', {profile: {age: 1, rand: [10]}} as any);
        test = await jc.get('test');
        expect(test?.profile?.age).to.be.eql(26);
        expect(test?.profile?.rand[0]).to.be.eql(11);
      });
      it('should not throw error when value is of type other than number',  async () => {
        const jc = new JSONCache<{
          messages: number;
          profile: {
            name: string;
            age: number;
            rand: number[];
          }
        }>(client);

        const obj = {
          messages: 10,
          profile: {
            name: 'testing',
            age: 25,
            rand: [1, 2, 3],
          },
        };
        await jc.set('test', obj);

        let test = await jc.get('test');
        expect(deepEq(test, obj)).to.be.true;

        await jc.incr('test', {profile: {rand: [null, 10]}} as any);
        test = await jc.get('test');
        expect(test?.profile?.rand[0]).to.be.eql(1);
        expect(test?.profile?.rand[1]).to.be.eql(12);
      });
    });

    describe('transactions', () => {
      describe('.set()', () => {
        it('should bind set to the provided transaction', async () => {
          const transaction = client.multi();

          await jsonCache.set('test1', {name: 'test1'}, {transaction});
          await jsonCache.set('test2', {name: 'test2'}, {transaction});


          await new Promise((res, rej) => {
            transaction
            .set('name', 'test3')
            .exec(async (err, replies) => {
              if (err) rej(err);
              else {
                expect(replies.length).to.eq(5);

                const test1: any = await jsonCache.get('test1');
                expect(test1.name).to.eq('test1');
                const test2: any = await jsonCache.get('test2');
                expect(test2.name).to.eq('test2');

                client.get('name', (err1, result) => {
                  if (err1) rej(err1);

                  expect(result).to.eq('test3');
                  res(null);
                });
              }
            });
          });
        });
        it('should bind set to the provided transaction with expiry being set', async () => {
          const transaction = client.multi();

          await jsonCache.set('test1', {name: 'test1'}, {transaction, expire: 1});

          await new Promise((res, rej) => {
            transaction
            .exec(async (err, replies) => {
              if (err) rej(err);
              else {
                expect(replies.length).to.eq(4);

                let test1: any = await jsonCache.get('test1');
                expect(test1.name).to.eq('test1');

                // after expiry
                await delay(1100);
                test1 = await jsonCache.get('test1');
                expect(test1).to.be.undefined;

                res(null);
              }
            });
          });
        });
      });

      describe('.delT()', () => {
        it('should bind del to the provided transaction', async () => {
          const transaction = client.multi();

          await jsonCache.set('test1', {name: 'test1'}, {transaction});

          console.log('exec 1 command');
          await new Promise((res, rej) => {
            transaction
            .exec(async (err, replies) => {
              if (err) rej(err);
              else {
                console.log('exec 2 command');
                
                expect(replies.length).to.eq(2);

                const test1: any = await jsonCache.get('test1');
                expect(test1.name).to.eq('test1');

                const transaction2 = client.multi();

                await jsonCache.del('test1', {transaction: transaction2});
                transaction2.exec(async (err1) => {
                  if (err1) rej(err1);
                  else {
                    const test1_1: any = await jsonCache.get('test1');
                    expect(test1_1).to.be.undefined;

                    res(null);
                  }
                });
              }
            });
          });
        });
      });

      describe('.rewriteT()', () => {
        it('should bind rewrite to the given transaction', async () => {
          const transaction = client.multi();

          await jsonCache.set('test1', {name: 'test1'}, {transaction});

          await new Promise((res, rej) => {
            transaction
              .exec(async (err, replies) => {
                if (err) rej(err);
                else {
                  expect(replies.length).to.eq(2);

                  const test1: any = await jsonCache.get('test1');
                  expect(deepEq(test1, {name: 'test1'})).to.be.true;

                  const transaction2 = client.multi();

                  await jsonCache.rewrite('test1', {age: 25}, {transaction: transaction2});
                  
                  transaction2.exec(async (err1) => {
                    if (err1) rej(err1);
                    else {
                      const test1_1: any = await jsonCache.get('test1');
                      expect(deepEq(test1_1, {age: 25})).to.be.true;

                      res(null);
                    }
                  });
                }
              });
          });
        });
      });

      describe('.incrT()', () => {
        it('should bind increment to the given transaction', async () => {
          const transaction = client.multi();

          await jsonCache.set('test1', {age: 25, rand: [1, 2]}, {transaction});

          await new Promise((res, rej) => {
            transaction
            .exec(async (err, replies) => {
              if (err) rej(err);
              else {
                expect(replies.length).to.eq(2);

                const test1: any = await jsonCache.get('test1');
                expect(deepEq(test1, {age: 25, rand: [1, 2]})).to.be.true;

                const transaction2 = client.multi();

                await jsonCache.incr('test1', {age: 1, rand: [undefined, 1]} as any, {transaction: transaction2});

                transaction2.exec(async (err1) => {
                  if (err1) rej(err1);
                  else {
                    const test1_1: any = await jsonCache.get('test1');
                    expect(deepEq(test1_1, {age: 26, rand: [1, 3]})).to.be.true;

                    res(null);
                  }
                });
              }
            });
          })
        });
      });
    });

    describe('#bug reports', () => {
      it('should not allow set&get of empty objects at the root', async () => {
        await jsonCache.set('test', {});
        const test: any = await jsonCache.get('test');

        expect(test).to.be.an('object');
        expect(Object.keys(test).length).to.be.eql(0);
      });

      it('should not allow adding props to empty objects at the root', async () => {
        await jsonCache.set('test', {});
        await jsonCache.set('test', {
          me: {},
        });

        const test: any = await jsonCache.get('test');

        expect(test).to.be.an('object');
        expect(test.me).to.be.an('object');
        expect(Object.keys(test.me).length).to.be.eql(0);
      });

      it('should accept empty strings as prefix', async () => {
        const customJsonCache = new JSONCache(client, {prefix: ''});
        await customJsonCache.set('test', {foo: 'bar'});
        const storedResult = await customJsonCache.get('test');
        expect((storedResult as any).foo).to.be.eq('bar');

        await new Promise((resolve, reject) => {
          client.hgetall('test', (err, result) => {
            if (err) reject(err);
            else {
              expect(result).not.to.be.undefined;
              expect(result.foo).to.be.eq('bar');
              resolve(true);
            }
          });
        });
      });
    });

    describe('#input combinations', () => {

      const inputs = [
        {
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
        },
        {},
        {
          a: 1,
          b: '1',
          c: false,
          d: true,
          e: null,
          f: undefined,
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
        },
        {},
        [],
        [{ a: 1 }, 1, true, false, null, undefined, 'test', [1, 2, { b: 1 }]],
      ];

      const jc = new JSONCache(client, {
        stringifier: {
          Date: (val: Date) => val.toISOString(),
        },
        parser: {
          Date: (str: string) => new Date(str),
        },
      });

      inputs.forEach((input, i) => {
        it(
          `should be able to save and retrieve the given object in the exact same shape for input: #${i}`,
          async () => {
            await jc.set('sameShape', input);

            const output = await jsonCache.get('sameShape');

            expect(deepEq(output, input, { strict: true }), `failed to match: \n\texpect: ${JSON.stringify(input, null, 2)}, \n\tactual: ${JSON.stringify(output, null, 2)}`).to.be.true;
          });
      });
    });
  });
