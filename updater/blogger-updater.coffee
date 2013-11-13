config = require('../config/config')
util = require('../models/util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
db = require('../models/db')
moment = require('moment')
Deferred = require('Deferred')
SourceUpdater = require('./index').SourceUpdater
createItem = require('./index').createItem
set_intersection = require('util').set_intersection

typeKey = 'entry'
sourceKey = 'blogger'

matchesCategories = (entry, categories) ->
  set_intersection(entry.categories||[], categories ||[]).length != 0

class BloggerUpdater extends SourceUpdater
  @typeKey: typeKey
  @sourceKey: sourceKey

  createDefinition: ->
    key: sourceKey
    types: [typeKey]
    config:
      feedUrl: 'http://tetk.blogspot.com/feeds/posts/default?alt=json'
      sharedCategories: ['t3kt.net']

    update: (projects) ->
      sharedCategories = @source.config.sharedCategories || []
      util.requestAsync(@source.config.feedUrl)
        .done((body)->
          data = JSON.parse(body)
          results =
            for entry in data.feed.entry
              categories = (entry.category||[]).map((c)-> c.term )
              projects = []
              for project in projects
                if matchesCategories(categories, project.blogCategories)
                  projects.push(project.key)
              if !projects.length and !matchesCategories(categories, sharedCategories)
                continue
              db.asyncFindOne('items', [{ type: typeKey, source: sourceKey, externalId: entry.id.$t }])
              .pipe( (exists) ->
                  if exists
                    return
                  ent = createItem( typeKey, sourceKey, entry.id.$t,
                    posted: moment(entry.published.$t).toDate()
                    categories: categories
                    title: entry.title.$t
                    contentHtml: entry.content.$t
                    projects: projects
                  )
                  db.insertItem(ent)
                )
          util.whenAll(results)
        )


module.exports = BloggerUpdater