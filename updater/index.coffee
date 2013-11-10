config = require('../config/config')
util = require('../models/util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
db = require('../models/db')
Deferred = require('Deferred')

class TypeUpdater
  run: (projects) ->
    db.asyncFindOne('itemType', {type: @constructor.type})
    .pipe((t) => t || @createDefinition() )
    .done((t) =>
        @typeDef = t
        @update(projects)
      )
  createDefinition: () -> NOT_IMPLEMENTED()
  update: (projects) ->
    util.whenAll( @updateProject(project) for project in projects )
      .done( => @updateDefinition)
  updateProject: (project) -> NOT_IMPLEMENTED()
  updateDefinition: () ->

exports.TypeUpdater = TypeUpdater

supportedTypes = {}

registerTypeModule = (moduleName)->
  T = require(moduleName)
  supportedTypes[T.type] = T

registerTypeModule('./github-updater')

updateAll = ->
  NOT_IMPLEMENTED()


exports.updateAll = updateAll
