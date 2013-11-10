
var _ = require('lodash');

module.exports = {
  flickrApiKey: '',
  blogFeedUrl:'http://tetk.blogspot.com/feeds/posts/default?alt=json',
  cacheTimeout: 180000,
  mongoConnectionUrl: 'mongodb://$OPENSHIFT_MONGODB_DB_HOST:$OPENSHIFT_MONGODB_DB_PORT/',
  mongoRootUser: '',
  mongoRootPassword: '',
  mongoDbName: '',
  mongoHost: '',
  mongoPort: -1,
  mongoOptions: {},
  mongoUri: ''
};

try
{
  _.extend(module.exports, require('./config.private.json'));
}
catch(e)
{
  // do nothing
}
var mongoUri = process.MONGOHQ_URL;
if(mongoUri)
  module.exports.mongoUri = process.MONGOHQ_URL;