









# redis-json


### Description

This library will store the JSON Object in Redis Hash-Sets and similarly you can retrieve the JSON data from Redis back in JSON object format.


### Installation

> npm install redis-json --save-dev

### Usage 

```javascript
var Redis = require('ioredis');
var JSONStore = require('./');

var redis = new Redis();

var jsonStore = new JSONStore(redis);

jsonStore.set('user', {
    a: 1,
    b: 2,
    c : {
        d: 3,
        e: 4
    }
}, function(err, result){
    console.log(err, result);
})

```

### API

**set(key, jsobObject, callback)**

*key*: The redis key that the JSON object has to be stored against.  
*jsonObject*: JSON obejct that needs to be stored.  
*callback(err, result)*: Will be called only the data is stored into redis.

if the key already exists, and is of type hashset, then the field in JSON object will get updated along with the existing data.


**get(key, callback)**

*key*: The redis key in which the JSON object was stored.
*callback(err, result)*: Will be called after fetching data from redis.

if the key is not of type hashset, then redis will through error.


**resave(key, jsonObj, callback)**

*key*: The redis key that whose value needs to be replaced with the new one.
*jsonObject*: JSON obejct that needs to be stored.  
*callback(err, result)*: Will be called once the data is replaced with the new JSON object.

Even if key is not of type hashset, resave will delete it and update the JSON object in the provided key.