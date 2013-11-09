config = require('../config/config')
Deferred = require("Deferred")
Cache = require("mem-cache")
cache = new Cache(config.cacheTimeout)

module.exports =
  getOrLoad: (key, load) ->
    value = cache.get(key)
    if value != null
      return value
    value = load(key)
    cache.set(key, value)
    value

  getOrLoadAsync: (key, load) ->
    value = cache.get(key)
    if value != null
      return Deferred.when(value)
    Deferred.when(load(key))
    .done((val) ->
        cache.set(key, val)
        return
      )

  getAsync: (key) ->
    value = cache.get(key)
    result = Deferred()
    if value == null
      result.reject(null)
    else
      result.resolve(value)
    result.promise()

  set: (key, value) ->
    cache.set(key, value)

  get: (key) ->
    cache.get(key)

