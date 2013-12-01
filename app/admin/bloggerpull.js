var models = require('../models'),
  config = require('../../config/config'),
  request = require('request'),
  async = require('async'),
  url = require('url'),
  _ = require('lodash'),
  moment = require('moment');

function cleanPropertyNames(obj)
{
  var out = {};
  _.forOwn(obj, function (val, key)
  {
    if (_.isArray(val))
      val = _.map(val, cleanPropertyNames);
    else if (_.isPlainObject(val))
      val = cleanPropertyNames(val);
    out[key.replace('$', '_')] = val;
  });
  return out;
}

function prepareEntry(key, entry, projects, sharedCategories)
{
  var categories = _.pluck(entry.category, 'term');
  return {
    entityType: models.Item.types.blogentry,
    key: key,
    project: _(projects).filter(function (p)
    {
      return !!_.intersection(p.blogCategories || [], (sharedCategories).concat(categories)).length;
    }).pluck('key').valueOf(),
    title: entry.title.$t,
    created: moment(entry.published.$t).toDate(),
    updated: moment(entry.updated.$t).toDate(),
    tags: categories,
    external: {
      source: 'blogger',
      id: entry.id.$t,
      url: _(entry.link).filter(function (l)
      {
        return l.rel == 'self';
      }).pluck('href').at(0),
      pulled: new Date(),
      data: cleanPropertyNames(entry)
    },
    content: {
      dataType: entry.content.type || 'html',
      data: entry.content.$t
    }
  };
}

function pullBloggerEntries(projects, opts, callback)
{
  opts = _.merge({
    feedUrl: config.blogFeedUrl,
    sharedCategories: config.blogSharedCategories || []
  }, opts);
  opts.log('Pulling from source blogger');
  var report = {
    added: 0,
    updated: 0,
    skipped: 0
  };
  request(opts.feedUrl, function (err, response, body)
  {
    if (err)
      callback(err);
    else if (response.statusCode != 200)
      callback(new Error('Error getting entries from blogger [' + response.statusCode + ']: ' + body));
    else
    {
      var responseData = JSON.parse(body),
        entries = responseData.feed.entry || [];
      opts.log('found', entries.length, 'entries');
      async.eachSeries(entries,
        function (entry, nextEntry)
        {
          var key = 'entry:blogger:' + entry.id.$t;
          entry = prepareEntry(key, entry, projects || [], opts.sharedCategories || []);
          if (!entry.project.length && !_.intersection(entry.tags || [], opts.sharedCategories || []).length)
            nextEntry(null);
          else
            models.getItem(key,
              function (err, storedEntry)
              {
                if (err)
                  nextEntry(err);
                else if (storedEntry)
                {
                  if (!opts.overwrite)
                  {
                    report.skipped++;
                    opts.log('skipping entry (key:', key, ')');
                    nextEntry();
                  }
                  else
                  {
                    storedEntry.update(entry, null,
                      function (err)
                      {
                        if (err)
                        {
                          opts.log('error updating entry (key:', key, '):', err);
                          nextEntry(err);
                        }
                        else
                        {
                          report.updated++;
                          opts.log('updated entry (key:', key, ')');
                          nextEntry();
                        }
                      });
                  }
                }
                else
                {
                  models.Item.create(entry,
                    function (err)
                    {
                      if (err)
                      {
                        opts.log('error adding entry (key:', key, '):', err);
                        nextEntry(err);
                      }
                      else
                      {
                        report.added++;
                        opts.log('added entry (key:', key, ')');
                        nextEntry();
                      }
                    });
                }
              })
        },
        function (err)
        {
          if (err)
          {
            opts.log('pull entries failed', err);
            callback(err);
          }
          else
          {
            opts.log('pull entries succeeded, added', report.added);
            callback(null, report.added);
          }
        });
    }
  });
}

module.exports = pullBloggerEntries;
