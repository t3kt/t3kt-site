var models = require('../models'),
  _ = require('lodash'),
  async = require('async');

var sources = {
  flickr: require('./flickrpull'),
  vimeo: require('./vimeopull'),
  github: require('./githubpull')
};

function pull(source, projects, opts, callback)
{
  opts = _.merge({ log: _.noop }, opts);
  var handler = sources[source];
  if (!handler)
  {
    callback(new Error('source not supported:', source));
  }
  else if (!projects || projects == 'all')
  {
    models.getProjects(function (err, projs)
    {
      if (err)
        callback(err);
      else
        pull(source, projs, opts, callback);
    })
  }
  else if (typeof(projects[0]) == 'string')
  {
    models.Project.find({key: {$in: projects}}).exec(function (err, projs)
    {
      if (err)
        callback(err);
      else
        pull(source, projs, opts, callback);
    });
  }
  else
  {
    handler(projects, opts, function (err, added)
    {
      if (!err)
      {
        if (!added)
          opts.log('nothing added');
        else
          opts.log('PULL SUCCEEDED! added', added);
      }
      callback(err, added);
    });
  }
}

module.exports = pull;
pull.sources = sources;
