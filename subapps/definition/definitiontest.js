var optimist = require('optimist'),
  D = require('./definitionapp');


(function (argv)
{
  argv = optimist(argv)
    .option('d', {alias: 'maxdist', default: 4, type: 'number'})
    .option('t', {alias: 'maxtotal', default: 20, type: 'number'})
    .option('w', {alias: 'word', type: 'string'})
    .argv;
  var net = D.NetworkBuilder({maxDistance: argv.d, maxTotal: argv.t});
  net.addWord(argv.w, function (err)
  {
    if (err)
      throw err;
    else
      net.dump();
  });
})(process.argv);

