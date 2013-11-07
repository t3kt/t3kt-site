_ = require('lodash')
Deferred = require('Deferred')
mongo = require('mongodb')
MongoClient = mongo.MongoClient
Server = mongo.Server
config = require('../config/config')
E = require('./entities')
util = require('./util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
cache = require('./cache')

mongoClient = new MongoClient( new Server( config.mongoHost, config.mongoPort, config.mongoOptions))
mongoDb = null

mongoClient.addListener( (e) -> mongoDb = null )

connect = () ->
  if mongoDb
    return Deferred.when(mongoDb)
  else
    return Deferred((dfd)->
      mongoClient.open((err, client)->
        if err
          dfd.reject(err)
          return
        else
          mongoDb = mongoClient.db(config.mongoDbName)
          dfd.resolve(mongoDb)
          return
      )
    )

asyncCall = (collection, method, args) ->
  connect()
    .pipe( (db) ->
      coll = db.collection(collection)
      return Deferred((dfd)->
        coll[method].apply(coll, (args||[]).concat( (err, result)->
          if err
            dfd.reject(err)
            return
          else
            dfd.resolve(result)
            return
        ))
      )
    )

asyncFindToArray = (collection, args) ->
  asyncCall(collection, 'find', args)
    .pipe( (cur)->
      Deferred((dfd)->
        cur.toArray( (err, docs) ->
          if err
            dfd.reject(err)
            return
          else
            dfd.resolve(docs)
            return
        )
      )
    )

getProjectList = () ->
  return cache.getOrLoadAsync('projects', ()->
    asyncFindToArray('projects', [{}, {sort: [['order', 1],['key', 2]]}])
  )
  .done( (list)->
      list.forEach((project)->
        cache.add('project:'+project.key, project)
      )
    )

getProject = (key) ->
  cache.getAsync('project:' + key)
  .pipe(null, () ->
      getProjectList()
        .pipe(() ->
          cache.get('project:' + key)
        )
    )

getItems = (var_args) ->
  asyncFindToArray('items', [].slice.call(arguments))

exports.getProjectList = getProjectList
exports.getProject = getProject
exports.getItems = getItems
exports.getProjectItems = (projectKey, type) ->
  query = {project:projectKey}
  if(type)
    query.type = type
  getItems(query)