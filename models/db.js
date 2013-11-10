// Generated by CoffeeScript 1.6.3
(function() {
  var Deferred, MongoClient, NOT_IMPLEMENTED, asyncCall, asyncFindOne, asyncFindToArray, config, connect, mongoDb, util,
    __slice = [].slice;

  Deferred = require('Deferred');

  MongoClient = require('mongodb').MongoClient;

  config = require('../config/config');

  util = require('./util');

  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED;

  mongoDb = null;

  connect = function() {
    if (mongoDb) {
      return Deferred.when(mongoDb);
    } else {
      console.log('connecting to mongo... ');
      return Deferred(function(dfd) {
        return MongoClient.connect(config.mongoUri, config.mongoOptions, function(err, db) {
          if (err) {
            console.log('connect to mongo failed', err);
            return dfd.reject(err);
          } else {
            console.log('connect to mongo succeeded');
            mongoDb = db;
            db.addListener('close', function() {
              return mongoDb = null;
            });
            return dfd.resolve(db);
          }
        });
      });
    }
  };

  exports.asyncCall = asyncCall = function(collection, method, args) {
    return connect().pipe(function(db) {
      var coll;
      coll = db.collection(collection);
      return Deferred(function(dfd) {
        console.log("calling mongo method " + method + " on " + collection, args);
        return coll[method].apply(coll, (args || []).concat(function(err, result) {
          if (err) {
            console.log("mongo call failed", err);
            return dfd.reject(err);
          } else {
            console.log("mongo call succeeded");
            return dfd.resolve(result);
          }
        }));
      });
    });
  };

  exports.asyncFindToArray = asyncFindToArray = function(collection, args) {
    return asyncCall(collection, 'find', args).pipe(function(cur) {
      return Deferred(function(dfd) {
        return cur.toArray(function(err, docs) {
          if (err) {
            return dfd.reject(err);
          } else {
            return dfd.resolve(docs);
          }
        });
      });
    });
  };

  exports.asyncFindOne = asyncFindOne = function(collection, args) {
    return asyncCall(collection, 'findOne', args);
  };

  exports.getProjects = function() {
    return asyncFindToArray('projects', [
      {}, {
        sort: [['order', 'ascending'], ['key', 'ascending']]
      }
    ]);
  };

  exports.getProject = function(key) {
    return asyncFindOne('projects', [
      {
        key: key
      }
    ]);
  };

  exports.getItems = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return asyncFindToArray('items', args);
  };

  exports.getItem = function(key) {
    return asyncFindOne('items', [
      {
        key: key
      }
    ]);
  };

  exports.getProjectItems = function(projectKey, type) {
    var query;
    query = {
      project: projectKey
    };
    if (type) {
      query.type = type;
    }
    return exports.getItems(query);
  };

  exports.insertItem = function(items) {
    return asyncCall('items', 'insert', [items]);
  };

}).call(this);
