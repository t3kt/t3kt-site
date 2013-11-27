var models = require('../models'),
  _ = require('lodash'),
  async = require('async');

var sources = exports.sources = {
  flickr: require('./flickrpull'),
  vimeo: require('./vimeopull')
};

function pull(source, project, opts, callback)
{
  opts = _.merge({ log: _.noop }, opts);
  var handler = sources[source];
  if (!handler)
  {
    callback(new Error('source not supported:', source));
  }
  else if (project == 'all')
  {
    models.getProjects(function (err, projects)
    {
      if (err)
        callback(err);
      else
      {
        async.eachSeries(projects,
          function (proj, next)
          {
            pull(source, proj, opts, next);
          },
          callback);
      }
    })
  }
  else if (typeof(project) == 'string')
  {
    models.getProject(project, function (err, proj)
    {
      if (err)
        callback(err);
      else if (!proj)
        callback(new Error('project not found:', project));
      else
      {
        pull(source, proj, opts, callback);
      }
    });
  }
  else
  {
    opts.log('Pulling from source', source, 'for project', (project && project.key) || project);
    handler(project, opts, function (err, added)
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
exports.pull = pull;

function run(source, project)
{
  pull(source, project,
    {
      log: function (message, etc)
      {
        console.log.apply(console, ['(' + source + ' pull): ' + message].concat([].slice.call(arguments, 1)));
      }
    },
    function (err, added)
    {
      if (err)
        throw err;
      else
        process.exit();
    });
}

exports.run = run;


if (!module.parent)
{
  run(process.argv[2], process.argv[3]);
}
