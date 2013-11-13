config = require('../config/config')
util = require('../models/util')
NOT_IMPLEMENTED = util.NOT_IMPLEMENTED
db = require('../models/db')
moment = require('moment')
Deferred = require('Deferred')
SourceUpdater = require('./index').SourceUpdater
createItem = require('./index').createItem
Flickr = require("node-flickr")

typeKey = 'image'
sourceKey = 'flickr'

class FlickrUpdater extends SourceUpdater
  @typeKey = typeKey
  @sourceKey = sourceKey

  createDefinition: ->
    key: sourceKey
    types: [typeKey]
    config:
      apiKey: config.flickrApiKey
      extras: 'date_taken,owner_name,tags,o_dims,path_alias,url_sq,url_t,url_s,url_m,url_o,path_alias'
  updateProject: (project) ->
    if not project.flickrSetId
      Deferred.when()
    else
      flickr = new Flickr({api_key: @source?.config?.apiKey || config.flickrApiKey })
      Deferred( (dfd) =>
        flickr.get('photosets.getPhotos', { photoset_id: project.flickrSetId, extras: @source.extras },
          (result) ->
            if result.stat != 'ok'
              dfd.reject(result)
            else
              results =
                for photo in result?.photoset?.photo
                  db.asyncFindOne('items', [{ type: typeKey, source: sourceKey, externalId: photo.id }])
                    .pipe( (exists) ->
                      if exists
                        return
                      image = createItem(typeKey, sourceKey, photo.id,
                        detailUrl: "http://www.flickr.com/photos/#{photo.path_alias || result.photoset.owner}/#{photo.id}/"
                        posted: moment(photo.datetaken).toDate()
                        full:
                          height: photo.height_o
                          width: photo.width_o
                          url: photo.url_o
                        thumb:
                          height: photo.height_s
                          width: photo.width_s
                          url: photo.url_s
                        projects: [project.key]
                      )
                      db.insertItem(image)
                    )
              util.whenAll(results)
        )
      )


module.exports = FlickrUpdater