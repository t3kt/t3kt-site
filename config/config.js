
var _ = require('lodash');

module.exports = _.extend({
  flickrApiKey: '',
  blogFeedUrl:'http://tetk.blogspot.com/feeds/posts/default?alt=json',
  cacheTimeout: 180000
}, require('./config.private.json'));