var _ = require('lodash');

var config = {
  flickrApiKey: '',
  blogFeedUrl: 'http://tetk.blogspot.com/feeds/posts/default?alt=json',
  cacheTimeout: 180000,
  mongoOptions: {},
  mongoUri: '',
  analyticsSiteId: 'UA-41056285-1',
  analyticsDomain: 't3kt.net',
  registrationAllowed: false,
  adminUser: null,
  adminPass: null,
  blogSharedCategories: null
};

_.merge(config, {
  mongoUri: process.env.MONGOHQ_URL,
  adminUser: process.env.FORMAGE_ADMIN_USER,
  adminPass: process.env.FORMAGE_ADMIN_PASS,
  analyticsSiteId: process.env.ANALYTICS_SITE_ID,
  analyticsDomain: process.env.ANALYTICS_DOMAIN,
  flickrApiKey: process.env.FLICKR_API_KEY
})

try
{
  _.merge(config, require('./config.private.json'));
}
catch (e)
{
  // do nothing
}

module.exports = config;