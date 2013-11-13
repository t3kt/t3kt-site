config = require('../config/config')
util = require('../models/util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
db = require('../models/db')
moment = require('moment')
Deferred = require('Deferred')
SourceUpdater = require('./index').SourceUpdater
createItem = require('./index').createItem

typeKey = 'video'
sourceKey = 'vimeo'

class VimeoUpdater extends SourceUpdater
  @typeKey: typeKey
  @sourceKey: sourceKey

  createDefinition: ->
    key: sourceKey
    types: [typeKey]
    config:
      embedBase: '//player.vimeo.com/video/'
      embedParams: 'portrait=0&badge=0&byline=0'

  updateProject: (project) ->
    if not project.vimeoAlbumId
      Deferred.when()
    else
      requestAsync("http://vimeo.com/api/v2/album/#{albumId}/videos.json")
        .pipe( (body) =>
          videos = JSON.parse(body)
          results =
            for video in videos
              db.asyncFindOne('items', [{type: typeKey, source: sourceKey, externalId: video.id}])
                .pipe( (exists) =>
                  if exists
                    return
                  embedSize = util.limitSize(video, {width: 400 })
                  vid = createItem(typeKey, sourceKey, video.id,
                    title: video.title
                    posted: moment(video.upload_date).toDate()
                    detailUrl: video.url
                    thumb:
                      width: embedSize.width
                      height: embedSize.height
                      url: video.thumbnail_large
                    embed:
                      width: embedSize.width
                      height: embedSize.height
                      url: "#{@source.config.embedBase}#{video.id}?#{@source.config.embedParams}")
                  db.insertItem(vid)
                )
          util.whenAll(results)
        )


module.exports = VimeoUpdater