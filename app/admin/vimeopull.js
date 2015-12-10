var models = require('../models'),
  config = require('../../config/config'),
  request = require('request'),
  async = require('async'),
  url = require('url'),
  _ = require('lodash'),
  moment = require('moment'),
  format = require('util').format;

var albumUrlFormat = 'https://vimeo.com/api/v2/album/%s/videos.json?page=%d';

function prepareVideo(key, video, project)
{
  return {
    entityType: models.Item.types.video,
    key: key,
    project: [project.key],
    title: video.title,
    created: moment(video.upload_date).toDate(),
    updated: new Date(),
    tags: video.tags ? video.tags.replace(/, /g, '').split(',') : [],
    external: {
      source: 'vimeo',
      id: video.id,
      url: video.url,
      pulled: new Date(),
      data: video
    },
    thumb: {
      width: 100,
      height: 75,
      url: video.thumbnail_small
    },
    small: {
      width: 200,
      height: 150,
      url: video.thumbnail_medium
    },
    medium: {
      width: 640,
      height: 640 * (video.height / video.width),
      url: video.thumbnail_large
    }
  };
}

function pullVimeoVideosForProject(project, opts, callback)
{
  if (!project.vimeoAlbumId)
  {
    opts.log('project does not have a vimeo album id');
    callback();
  }
  else
  {
    opts.logv('Pulling from source vimeo for project', project.key);
    var overwrite = opts.overwrite,
      report = {
        added: 0,
        updated: 0,
        skipped: 0
      };
    async.eachSeries([1, 2, 3],
      function (page, nextPage)
      {
        var reqUrl = format(albumUrlFormat, project.vimeoAlbumId, page);
        opts.log('pulling album page:', reqUrl);
        request(reqUrl, function (error, response, body)
        {
          if (error)
            callback(error);
          else if (response.statusCode != 200)
            callback(new Error('Error getting videos from vimeo [' + response.statusCode + ']: ' + body));
          else
          {
            var videos = JSON.parse(body);
            opts.log('found', videos.length, 'videos');
            async.eachSeries(videos,
              function (video, nextVideo)
              {
                var key = 'video:vimeo:' + video.id,
                  item = prepareVideo(key, video, project);
                models.getItem(key,
                  function (err, storedVideo)
                  {
                    if (err)
                      nextVideo(err);
                    else if (storedVideo)
                    {
                      if (!overwrite)
                      {
                        report.skipped++;
                        //opts.log('skipping video (key:', key, ')');
                        nextVideo();
                      }
                      else
                      {
                        storedVideo.update(item, null,
                          function (err)
                          {
                            if (err)
                            {
                              opts.log('error updating video (key:', key, '):', err);
                              nextVideo(err);
                            }
                            else
                            {
                              report.updated++;
                              opts.log('updated video (key:', key, ')');
                              nextVideo();
                            }
                          });
                      }
                    }
                    else
                    {
                      //opts.log('adding video (key:', key, ')');
                      models.Item.create(item,
                        function (err)
                        {
                          if (err)
                          {
                            opts.log('error adding video (key:', key, '):', err);
                            nextVideo(err);
                          }
                          else
                          {
                            report.added++;
                            opts.log('added video (key:', key, ')');
                            nextVideo();
                          }
                        });
                    }
                  });
              }, nextPage);
          }
        });
      },
      function (err)
      {
        callback(err, report);
      });
  }
}

function pullVimeoVideos(projects, opts, callback)
{
  async.eachSeries(projects,
    function (project, nextProject)
    {
      pullVimeoVideosForProject(project, opts, nextProject);
    },
    callback);
}
module.exports = pullVimeoVideos;
