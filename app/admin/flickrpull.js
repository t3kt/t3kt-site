var models = require('../models'),
  config = require('../../config/config'),
  request = require('request'),
  async = require('async'),
  url = require('url'),
  _ = require('lodash'),
  moment = require('moment');

var apiUrl = 'http://api.flickr.com/services/rest/',
  extras = 'date_upload,date_taken,last_update,tags,o_dims,path_alias,url_sq,url_t,url_s,url_m,url_o,owner_name';

function log(message, etc)
{
  console.log.apply(console, ['(flickr pull): ' + message].concat([].slice.call(arguments, 1)));
}

function pullFlickrImages(project, callback)
{
  if (typeof(project) == 'string')
  {
    models.getProject(project, function (err, proj)
    {
      if (err)
        callback(err);
      else if (!proj)
        callback(new Error('project not found: ', project));
      else
      {
        pullFlickrImages(proj, callback);
      }
    });
    return;
  }
  if (!project.flickrSetId)
    callback();
  else
  {
    var reqUrl = url.format(_.merge(url.parse(apiUrl), {
      query: {
        method: 'flickr.photosets.getPhotos',
        api_key: config.flickrApiKey,
        format: 'json',
        nojsoncallback: '1',
        photoset_id: project.flickrSetId,
        extras: extras
      }
    }));
    log('pulling set: ', reqUrl);
    request(reqUrl, function (error, response, body)
    {
      if (error)
        callback(error);
      else if (response.statusCode != 200)
        callback(new Error('Error getting photos from flickr [' + response.statusCode + ']: ' + body));
      else
      {
        var responseData = JSON.parse(body);
        if (responseData.stat != 'ok')
          callback(new Error('Error gettings photos from flickr: status= ' + responseData.stat));
        else
        {
          var photos = responseData.photoset.photo,
            added = 0;
          log('found ', photos.length, ' photos');
          async.eachSeries(photos,
            function (photo, next)
            {
              var key = 'image:flickr:' + photo.id;
              log('adding photo (key:', key, ')');
              models.Item.create(
                {
                  entityType: models.Item.types.image,
                  key: key,
                  project: [project.key],
                  title: photo.title,
                  created: moment(photo.datetaken).toDate(),
                  updated: new Date(),
                  tags: photo.tags ? photo.tags.split(' ') : undefined,
                  external: {
                    source: 'flickr',
                    id: photo.id,
                    url: 'http://www.flickr.com/photos/' + (photo.path_alias || photo.ownername) + '/' + photo.id + '/',
                    data: photo
                  },

                  thumb: {
                    width: photo.width_t,
                    height: photo.height_t,
                    url: photo.url_t
                  },
                  full: {
                    width: photo.width_o,
                    height: photo.height_o,
                    url: photo.url_o
                  },
                  small: {
                    width: photo.width_s,
                    height: photo.height_s,
                    url: photo.url_s
                  },
                  square: {
                    width: photo.width_sq,
                    height: photo.height_sq,
                    url: photo.url_sq
                  },
                  medium: {
                    width: photo.width_m,
                    height: photo.height_m,
                    url: photo.url_m
                  }
                },
                function (err)
                {
                  if (err)
                  {
                    log('error adding photo (key: ', key, '): ', err);
                    next(err);
                  }
                  else
                  {
                    added++;
                    log('added photo (key:', key, ')');
                    next();
                  }
                });
            },
            function (err)
            {
              if (err)
              {
                log('pull photos failed', err);
                callback(err);
              }
              else
              {
                log('pull photos succeeded, added ', added);
                callback(null, added);
              }
            });
        }
      }
    });
  }
}

module.exports = pullFlickrImages;

if (!module.parent)
{
  (function ()
  {
    var projectKey = process.argv[2];
    console.log('pulling flickr images for project', projectKey);
    pullFlickrImages(projectKey, function (err, added)
    {
      if (err)
        throw err;
      else
        console.log('PULL SUCCEEDED! added', added);
      process.exit();
    });
  })();
}
