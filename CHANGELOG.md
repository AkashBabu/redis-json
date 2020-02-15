# v3.2.0
* Now supports `.`(Dot) in object property (Ex. {'a.b': 'c'})

# v3.0.0
* Usage of typescript
* Better seggregation of files
* Bug fix for handling empty object and empty array

# v2.4.0
* Support for querying only the required fields of the object

# v2.3.0
* Added `clearAll` method, which clears all the cached Json

# v2.2.0
* Support for redis prefix keys

# v2.1.0
* Support for key expiry

# v2.0.0
### Breaking Changes
* Changed callbacks to native Promises
* required node version > 7.0.0
* `resave` has been renamed to `rewrite`
