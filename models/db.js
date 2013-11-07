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

function connect(then)
{
  if(mongoDb)
    then(mongoDb);
  else
    mongoClient.open(function(err, client)
    {
      if(err)
        throw err;
      mongoDb = mongoClient.db(config.mongoDbName);
      then(mongoDb);
    });
}

function asyncCall(collection, method, var_args)
{
  var args = [].slice.call(arguments, 2);
  return Deferred(function(dfd)
  {
    try
    {
      connect(function(db)
      {
        var coll = db.collection(collection);
        coll[method].apply(coll, args.concat(function(err, result)
        {
          if(err)
            dfd.reject(err);
          else
            dfd.resolve(err);
        }));
      });
    }
    catch(e)
    {
      dfd.reject(e);
    }
  });
}


function loadProjects()
{
  NOT_IMPLEMENTED();
}
function getProjectList()
{
  return cache.getOrLoadAsync('projects', function()
  {
    NOT_IMPLEMENTED();
  });
}
function getProject()
{

}

exports.getProjectList = getProjectList;

exports.getProject = function(id)
{
  NOT_IMPLEMENTED();
};