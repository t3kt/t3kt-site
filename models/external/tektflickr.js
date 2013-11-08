// tektflickr.js

var Flickr = require("node-flickr"),
  config = require("../../config/config"),
  Deferred = require("Deferred"),
  moment = require("moment"),
  E = require("../entities"),
  Cache = require("mem-cache"),
  cache = new Cache(config.cacheTimeout);

var flickr = new Flickr({api_key: config.flickrApiKey});

exports.getPhotosetPhotos = function (setId)
{
  var cached = cache.get(setId);
  if( cached )
    return Deferred.when(cached);
  return Deferred(function (dfd)
  {
    flickr.get('photosets.getPhotos', { photoset_id: setId, extras: 'date_taken,owner_name,tags,o_dims,path_alias,url_sq,url_t,url_s,url_m,url_o,path_alias'},
      function (result)
      {
        if (result.stat != 'ok')
        {
          dfd.reject(result);
        }
        else
        {
          var images = result.photoset.photo.map(function (photo)
          {
            return E.image({
              key: photo.id,
              title: photo.title,
              detailUrl: 'http://www.flickr.com/photos/' + (photo.path_alias || result.photoset.owner) + '/' + photo.id + '/',
              posted: moment(photo.datetaken),
              full : E.image.size({
                height: photo.height_o,
                width: photo.width_o,
                url: photo.url_o
              }),
              thumb: E.image.size({
                height: photo.height_s,
                width: photo.width_s,
                url: photo.url_s
              })
            });
          });
          cache.set(setId, images);
          dfd.resolve(images);
        }
      });
  });
};





