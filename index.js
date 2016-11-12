









var flatten = require('flat');
var unflatten = require('flat').unflatten;

var JSONStore = function (redis) {
    this.redis = redis;

    return this;
}

JSONStore.prototype.resave = function (key, jsonObj, done) {
    var self = this;
    this.redis.del(key, function (err, result) {
        if (err) {
            done(err);
        } else {
            self.set(key, jsonObj, done);
        }
    })
}

JSONStore.prototype.set = function (key, jsonObj, done) {
    var obj = flatten(jsonObj);
    var keyValArr = [];

    keyValArr.push(key);

    for (var key in obj) {
        keyValArr.push(key);
        keyValArr.push(obj[key]);
    }
    keyValArr.push(done);

    this.redis.hmset.apply(this.redis, keyValArr);
}

JSONStore.prototype.get = function (key, done) {
    this.redis.hgetall(key, function (err, result) {

        if (result) {
            done(null, unflatten(result));
        } else if (!err) {
            done(null, {});
        } else {
            done(err, null);
        }
    })
}

if (require.main == module) {
    var Redis = require('ioredis');

    var redis = new Redis({
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
        family: 4
    })

    var jsonStore = new JSONStore(redis);

    jsonStore.set('user', {
        name: 'akash',
        age: 21,
        address: {
            street: 21,
            place: 'Bangalore',
            state: 'Karnataka',
            country: 'India'
        }
    }, function (err, result) {
        console.log(err, result);

        jsonStore.get('user', function (err, result) {
            console.log(err, result);
        });
    })
}

module.exports = JSONStore;




