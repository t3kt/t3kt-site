var models = require('../models'),
  config = require('../../config/config'),
  request = require('request'),
  async = require('async'),
  url = require('url'),
  _ = require('lodash'),
  moment = require('moment'),
  format = require('util').format;

var albumUrlFormat = 'http://vimeo.com/api/v2/album/%s/videos.json?page=%d';

function pullVimeoVideos(project, opts, callback)
{
  if (!project.vimeoAlbumId)
  {
    opts.log('project does not have a vimeo album id');
    callback();
  }
  else
  {
    var added = 0;
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
                var key = 'video:vimeo:' + video.id;
                //opts.log('adding video (key:', key, ')');
                models.Item.create(
                  {
                    entityType: models.Item.types.video,
                    key: key,
                    project: [project.key],
                    title: video.title,
                    created: moment(video.upload_date).toDate(),
                    updated: new Date(),
                    tags: video.tags ? video.tags.replace(/, /g, '').split(',') : undefined,
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
                  },
                  function (err)
                  {
                    if (err)
                    {
                      opts.log('error adding video (key:', key, '):', err);
                      nextVideo(err);
                    }
                    else
                    {
                      added++;
                      opts.log('added video (key:', key, ')');
                      nextVideo();
                    }
                  });
              }, nextPage);
          }
        });
      },
      function (err)
      {
        callback(err, added);
      });
  }
}
module.exports = pullVimeoVideos;
