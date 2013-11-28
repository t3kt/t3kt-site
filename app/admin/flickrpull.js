var models = require('../models'),
  config = require('../../config/config'),
  request = require('request'),
  async = require('async'),
  url = require('url'),
  _ = require('lodash'),
  moment = require('moment');

var apiUrl = 'http://api.flickr.com/services/rest/',
  extras = 'date_upload,date_taken,last_update,tags,o_dims,path_alias,url_sq,url_t,url_s,url_m,url_o,owner_name';

function prepareImage(key, project, photo)
{
  return {
    entityType: models.Item.types.image,
    key: key,
    project: [project.key],
    title: photo.title,
    created: moment(photo.datetaken).toDate(),
    updated: new Date(),
    tags: photo.tags ? photo.tags.split(' ') : [],
    external: {
      source: 'flickr',
      id: photo.id,
      url: 'http://www.flickr.com/photos/' + (photo.path_alias || photo.ownername) + '/' + photo.id + '/',
      pulled: new Date(),
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
  };
}

function pullFlickrImagesForProject(project, opts, callback)
{
  if (!project.flickrSetId)
  {
    opts.log('project does not have a flickrSetId');
    callback();
  }
  else
  {
    opts.log('Pulling from source flickr for project', project.key);
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
    opts.log('pulling set: ', reqUrl);
    request(reqUrl, function (err, response, body)
    {
      if (err)
        callback(err);
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
          var overwrite = opts.overwrite,
            report = {
              added: 0,
              updated: 0,
              skipped: 0
            };
          opts.log('found ', photos.length, ' photos');
          async.eachSeries(photos,
            function (photo, next)
            {
              var key = 'image:flickr:' + photo.id,
                image = prepareImage(key, project, photo);
              models.getItem(key,
                function (err, storedImage)
                {
                  if (err)
                    next(err);
                  else if (storedImage)
                  {
                    if (!opts.overwrite)
                    {
                      report.skipped++;
                      opts.log('skipping image (key:', key, ')');
                      next();
                    }
                    else
                    {
                      storedImage.update(image, null,
                        function (err)
                        {
                          if (err)
                          {
                            opts.log('error updating image (key:', key, '):', err);
                            next(err);
                          }
                          else
                          {
                            report.updated++;
                            opts.log('updated image (key:', key, ')');
                            next();
                          }
                        });
                    }
                  }
                  else
                  {
                    models.Item.create(image,
                      function (err)
                      {
                        if (err)
                        {
                          opts.log('error adding image (key:', key, '):', err);
                          next(err);
                        }
                        else
                        {
                          report.added++;
                          opts.log('added image (key:', key, ')');
                          next();
                        }
                      });
                  }
                });
            },
            function (err)
            {
              if (err)
              {
                opts.log('pull photos failed', err);
                callback(err);
              }
              else
              {
                opts.log('pull photos succeeded, added', added);
                callback(null, added);
              }
            });
        }
      }
    });
  }
}

function pullFlickrImages(projects, opts, callback)
{
  async.eachSeries(projects,
    function (project, nextProject)
    {
      pullFlickrImagesForProject(project, opts, nextProject);
    },
    callback);
}

module.exports = pullFlickrImages;

