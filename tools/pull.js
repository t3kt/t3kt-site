var pull = require('../app/admin/pull'),
  optimist = require('optimist'),
  async = require('async'),
  models = require('../app/models');

(function (argv)
{
  argv = optimist(argv)
    .option('o', { alias: 'overwrite', default: false, type: 'boolean' })
    .option('s', { alias: 'source', default: 'all', type: 'string' })
    .option('p', { alias: 'project', default: 'all', type: 'string' })
    .argv;
  var opts = {
    log: function (message, etc)
    {
      console.log.apply(console, arguments);
    },
    overwrite: argv.o
  };
  var sources = [];
  if (argv.s == 'all' || !argv.s)
    sources = Object.keys(pull.sources);
  else if (Array.isArray(argv.s))
    sources = argv.s;
  else
    sources = [argv.s];
  var projectKeys = null;
  if (argv.p == 'all' || !argv.p)
    projectKeys = null;
  else if (Array.isArray(argv.p))
    projectKeys = argv.p;
  else
    projectKeys = [argv.p];

  models.getProjects(projectKeys,
    function (err, projects)
    {
      if (err)
        throw err;

      async.eachSeries(sources,
        function (source, nextSource)
        {
          pull(source, projects, opts,
            function (err, report)
            {
              if (err)
                nextSource(err);
              if (report)
                console.log('pull completed (added:%d,updated:%d,skipped:%d)', report.added, report.updated, report.replaced);
              nextSource();
            });
        },
        function (err)
        {
          if (err)
            throw err;
          console.log('DONE!');
          process.exit();
        });
    });
})(process.argv);
