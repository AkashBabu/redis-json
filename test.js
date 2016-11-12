










var Redis = require('ioredis');
var JSONStore = require('./');

var redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: '',
    db: 0,
    family: 4
})

// console.log(typeof JSONStore);

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
}, function(err, result){
    console.log(err, result);

    jsonStore.get('user', function(err, result){
        console.log(err, result);

        jsonStore.resave('user', {
            name: 'Akash',
            age: 21
        }, function(err, result){
            console.log(err, result);

            jsonStore.get('user', console.log);
        })
    })
})