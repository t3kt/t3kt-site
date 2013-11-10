Deferred = require('Deferred')
MongoClient = require('mongodb').MongoClient
config = require('../config/config')
util = require('./util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED

mongoDb = null

connect = ->
  if mongoDb
    return Deferred.when(mongoDb)
  else
    console.log 'connecting to mongo... ' + config.mongoHqUri
    return Deferred((dfd)->
      MongoClient.connect(config.mongoHqUri, config.mongoOptions, (err, db)->
        if err
          console.log 'connect to mongo failed', err
          dfd.reject(err)
        else
          console.log 'connect to mongo succeeded'
          mongoDb = db
          db.addListener('close', -> mongoDb = null )
          dfd.resolve(db)
      )
    )

exports.asyncCall =
asyncCall = (collection, method, args) ->
  connect()
    .pipe( (db) ->
      coll = db.collection(collection)
      return Deferred((dfd)->
        console.log "calling mongo method #{method} on #{collection}", args
        coll[method].apply(coll, (args||[]).concat( (err, result)->
          if err
            console.log "mongo call failed", err
            dfd.reject(err)
          else
            console.log "mongo call succeeded"
            dfd.resolve(result)
        ))
      )
    )

exports.asyncFindToArray =
asyncFindToArray = (collection, args) ->
  asyncCall(collection, 'find', args)
    .pipe( (cur)->
      Deferred((dfd)->
        cur.toArray( (err, docs) ->
          if err
            dfd.reject(err)
          else
            dfd.resolve(docs)
        )
      )
    )

exports.asyncFindOne =
asyncFindOne = (collection, args) ->
  asyncCall(collection, 'findOne', args)

exports.getProjects = ->
  asyncFindToArray('projects', [{}, {sort: [['order', 'ascending'],['key', 'ascending']]}])

exports.getProject = (key) ->
  asyncFindOne('projects', [{ key: key }])

exports.getItems = (args...) ->
  asyncFindToArray('items', args)

exports.getItem = (key) ->
  asyncFindOne('items', [{ key: key }])

exports.getProjectItems = (projectKey, type) ->
  query = {project:projectKey}
  if(type)
    query.type = type
  exports.getItems(query)

exports.insertItem = (items) ->
  asyncCall('items', 'insert', [items])

