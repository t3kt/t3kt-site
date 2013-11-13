config = require('../config/config')
util = require('../models/util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
db = require('../models/db')
Deferred = require('Deferred')
_ = require('lodash')

class SourceUpdater
  @sourceKey: null
  @typeKey: null
  @source: null
  constructor: (opts) ->
    @opts = opts || {}
    @sourceKey = @constructor.sourceKey
    @typeKey = @constructor.typeKey
  run: (projects) ->
    db.asyncFindOne('source', {key: @constructor.sourceKey})
    .pipe((s) => s || @createDefinition() )
    .done((s) =>
        @source = s
        @update(projects)
      )
  createDefinition: () ->
    key: @constructor.sourceKey
    types: [@constructor.typeKey]
  update: (projects) ->
    util.whenAll( @updateProject(project) for project in projects )
      .done( => @updateDefinition() )
  updateProject: (project) -> NOT_IMPLEMENTED()
  updateDefinition: () ->

exports.SourceUpdater = SourceUpdater

exports.createItem = (type, source, externalId, props) ->
  item =
    type: type
    source: source
    key: "#{type}:#{source}:#{externalId}"
    externalId: externalId
    updated: new Date()
    external: true
  _.extend(item, props)

supportedSources = {}

registerSourceUpdater = (updater)->
  supportedSources[updater.sourceKey] = updater

[ require('./github-updater'), require('./flickr-updater'),
  require('./vimeo-updater'), require('./blogger-updater') ]
  .forEach(registerSourceUpdater)

updateAll = (opts) ->
  opts = opts || {}
  sources = opts.sources || Object.keys(supportedSources)
  updaters =
    for sourceKey in sources
      updater = supportedSources[sourceKey]
      if not updater
        throw new Error('Source not supported: ' + sourceKey)
      updater
  projectKeys = opts.projects
  db.getProjects()
    .pipe( (projects) ->
      projects = p for p in projects when !projectKeys || projectKeys.indexOf(p.key)!=-1
      util.whenAll(
        for updater in updaters
          console.log("Running updater #{updater.sourceKey}:#{updater.typeKey}...")
          updater.update(projects)
            .done(->
              console.log("Updater #{updater.sourceKey}:#{updater.typeKey} finished")
            )
      )
    )
  .done( ->
    console.log('All updaters finished')
  )


exports.updateAll = updateAll
