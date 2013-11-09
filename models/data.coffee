util = require('./util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
#cache = require('./cache')
db = require('./db')

#Facade =
#  getProjects: -> NOT_IMPLEMENTED()
#  getProject: (key) -> NOT_IMPLEMENTED()
#  getItems: (projectKey, type, opts) -> NOT_IMPLEMENTED()
#  getItem: (key) -> NOT_IMPLEMENTED()
#  getProjectItems: (projectKey, type) -> NOT_IMPLEMENTED()

DbFacade =
  getProjects: db.getProjects
  getProject: db.getProject
  getItems: db.getItems
  getItem: db.getItem
  getProjectItems: (projectKey, type) ->
    query = {project: projectKey}
    if type
      query.type = type
    @getItems(query)

#CachedDbFacade =
#  getProjects: ->
#    cache.getOrLoadAsync('projects', ->
#      DbFacade.getProjects()
#        .done((projects) ->
#          cache.set("project:#{project.key}", project) for project in projects
#          return projects
#        )
#      )
#  getProject: (key) ->
#    cache.getOrLoadAsync "project:#{key}", ->
#      DbFacade.getProject(key
#        .done((project) ->
#          cache.set("project:#{project.key}", project)
#          return project
#        )
#      )
#  getItems: DbFacade.getItems
#  getProjectItems: (projectKey, type) ->


module.exports = DbFacade

