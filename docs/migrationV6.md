# Migrating from V5 -> V6

## Move away from confusing methods

Earlier `setT`, `delT`, `rewriteT` & `incrT` methods were introduced to handle queries on Transactions. Now this functionality is merged with their original methods `set`, `del`, `rewrite` & `incr`  

**Suggested Changes:**
* `setT(transaction, key, obj)` -> `set(key, obj, {transaction})`
* `rewriteT(transaction, key, obj)` -> `rewrite(key, obj, {transaction})`
* `delT(transaction, key, obj)` -> `del(key, {transaction})`
* `incrT(transaction, key, obj)` -> `incr(key, obj, {transaction})`


## Array would be replaced on set

When you try to set data on an already existing JSON and if the data contains an array, then the array in the cached JSON would be replaced with the array in the data.

**For example:**  

Cached JSON
```JSON
{
  "foo": [1,2,3],
  "bar": "baz"
}
```

Data
```JSON
{
  "foo": [4,5]
}
```

Result (V5)
```JSON
{
  "foo": [4,5,3],
  "bar": "baz"
}
```

Result (V6)
```JSON
{
  "foo": [4,5],
  "bar": "baz"
}
```

Like you observed in the above example, starting with V6 we replace the stored array instead of replacing only the provided indices.   
So if this applies to you, then you must make corrective changes in case you want to retain V5's behaivour

**Suggested Changes:**
```TS
const jc = new JSONCache({...})

await jc.set('test', {
  "foo": [1,2,3],
  "bar": "baz"
})


// if you want to retain the other
// elements in the array
const cachedData = await jc.get('test');
cachedData.foo[0] = 4;
cachedData.foo[1] = 5;

await jc.set('test', cachedData);

/// Result
// {
//   "foo": [4,5,3],
//   "bar": "baz"
// }

```
