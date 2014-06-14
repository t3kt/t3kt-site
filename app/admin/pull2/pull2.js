var _ = require('lodash'),
  async = require('async');

function Report()
{
  this.entries = {};
}
Report.prototype = {
  entries: null,
  add: function (type, counts)
  {
    var entry = this.entries[type];
    if (!entry)
    {
      this.entries[type] = entry = {added: 0, updated: 0, skipped: 0 };
    }
    entry.added = entry.added + (counts.added || 0);
    entry.updated = entry.updated + (counts.updated || 0);
    entry.skipped = entry.skipped + (counts.skipped || 0);
  }
};

var logLevels = {
  error: 0,
  warning: 1,
  info: 2,
  debug: 3
};
function convertLogLevel(level)
{
  if (typeof(level) == 'string')
    level = Logger.levels[level];
  return level == null ? Logger.levels.info : level;
}

function Logger(opts)
{
  if (typeof(opts) == 'number' || typeof(opts) == 'string')
    opts = {maxLevel: opts};
  _.merge(this, opts || {});
  this.maxLevel = convertLogLevel(this.maxLevel);
}
Logger.levels = logLevels;
Logger.prototype = {
  maxLevel: Logger.levels.info,
  log: function (level, msg, etc)
  {
    level = convertLogLevel(level);
    if (level <= this.maxLevel)
      this.output([].slice.call(arguments, 1));
  },
  output: function (args)
  {
    console.log.apply(console, args);
  }
};

function Puller(opts)
{
  _.merge(this, opts || {});
  this.report = this.report || new Report();
}
Puller.prototype = {
  logger: new Logger(Logger.levels.warning)
};
