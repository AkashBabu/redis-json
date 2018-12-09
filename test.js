const JSONCache = require('.')
const Redis = require('ioredis')
const redis = new Redis({ dropBufferSupport: true })

const { expect } = require('chai')
const deepEq = require('deep-equal')
const delay = require('delay')

const jsonCache = new JSONCache(redis)

// const testObj = {
//   name: 'redis-json',
//   age: 25,
//   address: {
//     doorNo: '12B',
//     locality: 'pentagon',
//     pincode: 123456
//   },
//   cars: ['BMW 520i', 'Audo A8']
// }

const testObj = {
  "_id": "5c0bf503712cbe5144b0614c",
  "ctime": "2018-12-08T16:44:24.981Z",
  "name": "test",
  "empId": "123",
  "pwd": "$2b$08$mUrKnOn8zEMGYv8hSPZXiOeBc.5RU5ulJz5MFqSNwoNbK.iwI89Gy",
  "dob": "1991-11-01T00:00:00Z",
  "role": 0,
  "jtis": {
    "zunLjUrEC": {
      "exp": 1544892291851
    }
  },
  "__v": 0
}

describe('redis-json', () => {

  before(async () => {
    const multi = redis.multi([["del", "name"]])
    await multi.exec()

  })

  // Clear only the prefixed keys
  before(jsonCache.clearAll.bind(jsonCache))

  // Clear only the prefixed keys
  after(jsonCache.clearAll.bind(jsonCache))

  it('should save json object without any error', async () => {
    await jsonCache.set('1', testObj)
  })

  it('should not replace other properties when set is used', async () => {
    const extra = { another: 'value' }
    await jsonCache.set('2', extra)
    await jsonCache.set('2', testObj)

    const response = await jsonCache.get('2')
    expect(deepEq(response, Object.assign(testObj, extra)))
  })

  it('should retreive the JSON object in the same shape as was saved', async () => {
    await jsonCache.set('3', testObj)

    const response = await jsonCache.get('3')

    expect(deepEq(testObj, response)).to.be.true
  })

  it('should replace the Object when resave is used', async () => {
    await jsonCache.set('4', Object.assign(testObj, { another: 'value' }))

    await jsonCache.rewrite('4', testObj)

    const response = await jsonCache.get('4')
    expect(deepEq(testObj, response)).to.be.true
  })

  it('should expire the keys after the given expiry time', async () => {
    await jsonCache.set('5', Object.assign(testObj, { another: 'value' }), {
      expire: 1
    })

    await delay(1010);

    const response = await jsonCache.get('5')
    expect(response).to.not.exist
  })

  it('should support prefix for the store object', async () => {
    const obj = { [(Math.random() * 100).toString()]: (Math.random() * 1000).toString() }
    await jsonCache.set('6', obj)

    const redisData = await redis.hgetall(`${jsonCache.prefix}6`)

    expect(deepEq(redisData, obj)).to.be.true
  })

  it('should remove all the keys on clearAll', async () => {
    const obj = { a: 1 }
    await jsonCache.set('7', obj)

    await jsonCache.clearAll()

    const keys = await redis.keys(`${jsonCache.prefix}*`)
    expect(keys).to.have.length(0)

  })
})