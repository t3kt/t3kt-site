var request = require('request'),
  url = require('url'),
  _ = require('lodash');

var oembedUrl = 'http://vimeo.com/api/oembed.json';

function getVimeoEmbed(video, params, callback)
{
  if (!video.external || video.external.source !== 'vimeo')
    callback(new Error('Video is not from vimeo:', video ? video.key : '(null)'));
  else
  {
    params = _.merge({
      url: video.external.url,
      byline: false,
      title: true,
      portrait: false,
      loop: false,
      autopause: true,
      autoplay: false,
      player_id: ''
    }, params);
    var reqUrl = url.format(_.merge(url.parse(oembedUrl), { query: params }));
    request(reqUrl, function (err, response, body)
    {
      if (err)
        callback(err);
      else if (response.statusCode != 200)
        callback(new Error('Error getting embed code from vimeo [' + response.statusCode + ']: ' + body));
      else
      {
        var embed = JSON.parse(body);
        callback(null, embed);
      }
    })
  }
}
exports.getEmbed = getVimeoEmbed;

