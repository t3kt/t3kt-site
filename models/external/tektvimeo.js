
var config = require("../../config/config"),
  Deferred = require("Deferred"),
  moment = require("moment"),
  E = require("../entities"),
  util = require("../util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  requestAsync = util.requestAsync;


exports.getAlbumVideos = function(albumId)
{
  return requestAsync('http://vimeo.com/api/v2/album/' + albumId + '/videos.json')
    .pipe(function(body){
      var videos = JSON.parse(body);
      return Deferred.when.apply(null, videos.map(convertVideo));
    });
};

function convertVideo(video)
{
  var embedSize = util.limitSize(video, {width: 400 });
  return E.video({
    key: video.id,
    title: video.title,
    posted: moment(video.upload_date),
    detailUrl: video.url,
    thumbPath: video.thumbnail_large,
    embedWidth: embedSize.width,
    embedHeight: embedSize.height,
    embedUrl : '//player.vimeo.com/video/' + video.id+'?portrait=0&badge=0&byline=0'
  });
}