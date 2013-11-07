var _ = require('lodash'),
  Deferred = require("Deferred"),
  mongo = require('mongodb'),
  MongoClient = mongo.MongoClient,
  Server = mongo.Server,
  config = require('../config/config'),
  E = require("./entities"),
  util = require('./util'),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  cache = require('./cache');

var mongoClient = new MongoClient( new Server( config.mongoHost, config.mongoPort, config.mongoOptions )),
  mongoDb;

mongoClient.addListener('close', function(){  mongoDb = null; });

function connect()
{
  if(mongoDb)
    return Deferred.when(mongoDb);
  else
    return Deferred(function(dfd)
    {
      mongoClient.open(function(err, client)
      {
        if(err)
          dfd.reject(err);
        else
        {
          mongoDb = mongoClient.db(config.mongoDbName);
          dfd.resolve(mongoDb);
        }
      });
    });
}

function asyncCall(collection, method, args)
{
  return connect()
    .pipe(function(db)
    {
      var coll = db.collection(collection);
      return Deferred(function(dfd)
      {
        coll[method].apply(coll, (args||[]).concat(function(err, result)
        {
          if(err)
            dfd.reject(err);
          else
            dfd.resolve(result);
        }));
      });
    });
}

function asyncFindToArray(collection, args)
{
  return asyncCall(collection, 'find', args)
    .pipe(function(cur)
    {
      return Deferred(function(dfd)
      {
        cur.toArray(function(err, docs)
        {
          if(err)
            dfd.reject(err);
          else
            dfd.resolve(docs);
        });
      });
    });
}


function getProjectList()
{
  return cache.getOrLoadAsync('projects', function()
  {
    return asyncFindToArray('projects', [{}, {sort: [['order', 1], ['key', 2]]}]);
  })
    .done(function(list)
    {
      list.forEach(function(project)
      {
        cache.add('project:'+project.key, project);
      });
    });
}
function getProject(key)
{
  return cache.getAsync('project:' + key)
    .pipe(null, function()
    {
      return getProjectList()
        .pipe(function()
        {
          return cache.get('project:'+ key);
        });
    })
}

function getItems(var_args)
{
  return asyncFindToArray('items', [].slice.call(arguments) );
}

exports.getProjectList = getProjectList;

exports.getProject = getProject;

exports.getItems = getItems;

exports.getProjectItems = function(projectKey, type)
{
  var query = {project:projectKey};
  if(type)
    query.type = type;
  return getItems(query);
};
