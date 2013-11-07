var config = require('../config/config'),
  Deferred = require("Deferred"),
  Cache = require("mem-cache"),
  cache = new Cache(config.cacheTimeout);

exports.getOrLoad = function(key, load)
{
  var value = cache.get(key);
  if(value != null)
    return value;
  value = load(key);
  cache.set(key, value);
  return value;
};

exports.getOrLoadAsync = function(key, load)
{
  var value = cache.get(key);
  if(value != null)
    return Deferred.when(value);
  return Deferred.when(load(key))
    .done(function(val){
      cache.set(key, val);
    });
};

exports.add = function(key, value)
{
  cache.add(key, value);
};
