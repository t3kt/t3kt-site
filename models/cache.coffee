config = require('../config/config')
Deferred = require("Deferred")
Cache = require("mem-cache")
cache = new Cache(config.cacheTimeout)

exports.getOrLoad = (key, load) ->
  value = cache.get(key)
  if value != null
    return value
  value = load(key)
  cache.set(key, value)
  value

exports.getOrLoadAsync = (key, load) ->
  value = cache.get(key)
  if value != null
    return Deferred.when(value)
  Deferred.when(load(key))
    .done((val) ->
      cache.set(key, val)
      return
    )

exports.getAsync = (key) ->
  value = cache.get(key)
  result = Deferred()
  if value == null
    result.reject(null)
  else
    result.resolve(value)
  result.promise()

exports.add = (key, value) ->
  cache.add(key, value)

