var _ = require('lodash');

var config = {
  flickrApiKey: '',
  blogFeedUrl: '',
  cacheTimeout: 180000,
  mongoOptions: {},
  mongoUri: '',
  analyticsSiteId: 'UA-46134708-1',
  analyticsDomain: 't3kt.net',
  registrationAllowed: false,
  adminUser: null,
  adminPass: null,
  blogSharedCategories: null,
  analyticsEnabled: true
};

_.merge(config, {
  mongoUri: process.env.MONGOHQ_URL,
  adminUser: process.env.FORMAGE_ADMIN_USER,
  adminPass: process.env.FORMAGE_ADMIN_PASS,
  analyticsSiteId: process.env.ANALYTICS_SITE_ID,
  analyticsDomain: process.env.ANALYTICS_DOMAIN,
  flickrApiKey: process.env.FLICKR_API_KEY,
  blogFeedUrl: process.env.BLOG_FEED_URL
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