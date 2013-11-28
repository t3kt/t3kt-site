config = require('../config/config')
util = require('../models/util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
db = require('../models/db')
moment = require('moment')
Deferred = require('Deferred')
SourceUpdater = require('./index').SourceUpdater
createItem = require('./index').createItem
parseLinkHeader = require('../app/linkheaders').parse


retrieveCommitBatch = (url, callback) ->
  util.requestAsync(url)
    .pipe((body, response)->
      commits = JSON.parse(body)
      util.when(callback(commits))
        .done((result) ->
          if(result is false)
            return
          header = response.hasHeader('link', null)
          header = header and response.headers[header]
          links = header and parseLinksHeader(header)
          if links
            next = (link.href for link in links when link.rel is 'next')[0]
            if next
              return retrieveCommitBatch(next, callback)
        )
    )

sourceKey = 'github'
typeKey = 'commit'

class GithubUpdater extends SourceUpdater
  @typeKey = typeKey
  @sourceKey = sourceKey

  createDefinition: ->
    key: sourceKey
    types: [typeKey]
    config: {}

  updateProject: (project) ->
    if not project.githubRepo
      Deferred.when()
    else
      repoUrl = "https://api.github.com/repos/t3kt/#{project.githubRepo}"
      util.requestAsync(repoUrl)
        .pipe((body) ->
          # need the unique numeric repo ID to be sure that commit keys don't change if the repo is renamed
          repo = JSON.parse(body)
          retrieveCommitBatch(repoUrl + "/commits?per_page=50", (commits) ->
            results =
              for obj in commits
                extId = "#{repo.id}:#{obj.sha}"
                db.asyncFindOne('items', [{ type: typeKey, source: sourceKey, externalId: extId }])
                  .pipe( (exists) ->
                    if exists
                      return
                    commit =
                      createItem( typeKey, sourceKey, extId,
                        detailUrl: obj.html_url
                        posted: moment(obj.commit.committer.date).toDate()
                        title: obj.commit.message
                        projects: [project.key]
                      )
                    db.insertItem(commit)
                  )
            util.whenAll(results)
          )
        )

module.exports = GithubUpdater