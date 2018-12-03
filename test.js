const JSONCache = require('.')
const Redis = require('ioredis')
const redis = new Redis({ dropBufferSupport: true })
const {expect} = require('chai')
const deepEq = require('deep-equal')
const delay = require('delay')

const jsonCache = new JSONCache(redis)

const testObj = {
  name: 'redis-json',
  age: 25,
  address: {
    doorNo: '12B',
    locality: 'pentagon',
    pincode: 123456
  },
  cars: ['BMW 520i', 'Audo A8']
}


describe('redis-json', () => {
  beforeEach(done => {
    redis.flushall(done)
  })

  it('should save json object without any error', async() => {
    await jsonCache.set('123', testObj)
  })

  it('should not replace other properties when set is used', async () => {
    const extra = {another: 'value'}
    await jsonCache.set('123', extra)
    await jsonCache.set('123', testObj)

    const response = await jsonCache.get('123')
    expect(deepEq(response, Object.assign(testObj, extra)))
    // expect(response).to.have.property('another')
    // expect(response).to.have.property('name')
  })

  it('should retreive the JSON object in the same shape as was saved', async ()=> {
    await jsonCache.set('123', testObj)

    const response = await jsonCache.get('123')
    expect(deepEq(testObj, response)).to.be.true
  })
  
  it('should replace the Object when resave is used', async () => {
    await jsonCache.set('123', Object.assign(testObj, {another: 'value'}))
    
    await jsonCache.rewrite('123', testObj)
    
    const response = await jsonCache.get('123')
    expect(deepEq(testObj, response)).to.be.true
  })

  it('should expire the keys after the given expiry time', async () => {
    await jsonCache.set('123', Object.assign(testObj, {another: 'value'}), {
      expire: 1
    })
    
    await delay(1010);

    const response = await jsonCache.get('123')
    expect(response).to.not.exist
  })
})