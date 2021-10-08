# v6.0.2
* minor bug fixes and performance improvements

# v6.0.1
* adds function overload definition for `get` as `get(key: string): Promise<T|undefined>`

# v6.0.0
* improves efficiency by combining multiple commands into one `multi` command
* fixes code smells
* replace the entire array when an array is present in the set command
* removes all `<set|del|rewrite|incr>T` methods and integrates transaction within `<set|del|rewrite|incr>` method itself

# v5.0.0
* supports empty string as pre-fixes

# v4.3.0
* adds `.incr()` & `.incrT()` methods to allow incrementing of values using `hincrbyfloat`.

# v4.2.1
* fixes #14, wherein when any prop was `set(id, {})` on an empty object, it wasn't reflected when `get()` was called on it

# v4.2.0
* adds support for transactions via `setT`, `delT` & `rewriteT` methods
* `rewrite` method now support expiry. Please check the API docs for more details

# v4.1.0
* adds `.del()` method

# v4.0.1
* `clearAll()` now scans the DB via `scan` command(with a COUNT 100), instead of getting all the prefixed keys via `keys` command which would block the DB if the list is huge
* Now allows fetching of internal fields as well -> `jsonCache.get('test', 'name', 'address', 'cars.0')`
* Improves documentation
* fixes a bug, if the key contains '/.' in it, then it was being misinterpreted during retrieval of data from DB
* adds more test cases for robustness
* seggregates test cases for better readability

# v4.0.0
* Total rewrite of the library for better maintenance and performance improvement
* Provides extension for custom types, which allows the users to defines how the custom object has to be stored in Redis and how to revive the same back from redis
* Now provide type support, which means that the type of data use save in jsonCache is exactly(===) the same that you get back

# v3.2.1
* Now supports [`redis`](https://www.npmjs.com/package/redis) client
* Improves efficiency by replacing `.call` with `.bind` while initializing internal redisClient
* fixes #7
* removes the support for browsers (I know it was stupid for this library 😭)

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
