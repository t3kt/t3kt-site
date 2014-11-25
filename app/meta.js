var _ = require('lodash'),
  util = require('./util'),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  config = require('../config/config'),
  async = require('async'),
  d = require('./models'),
  models = require('./models/models'),
  moment = require('moment');

function createEntry(path, date)
{
  return {
    loc: config.appRootUrl + path,
    date: formatDate(date)
  };
}

function formatDate(date)
{
  return date && moment(date).format('YYYY-MM-DD');
}

function buildProjectEntries(callback)
{
  d.getProjects(null, function (err, projects)
  {
    if (err)
      return callback(err);
    async.map(projects,
      function (project, next)
      {
        d.getProjectLatestItem(project.key, null, function (err, item)
        {
          if (err)
            return next(err);
          next(null, createEntry('/projects/' + project.key, item && item.updated));
        });
      },
      callback);
  });
}

function buildPageEntries(callback)
{
  d.getAllPages(function (err, pages)
  {
    if (err)
      return callback(err);
    var entries = _.map(pages, function (page)
    {
      return createEntry(page.project ?
          ('/projects/' + page.project + '/pages/' + page.key) :
          ('/pages/' + page.key),
        page.updated);
    });
    callback(null, entries);
  });
}

function buildMainEntries(callback)
{
  async.concat([
      function (next)
      {
        d.getLatestItem(null, 'blogentry', function (err, item)
        {
          if (err)
            return next(err);
          next(null, [createEntry('/news', item && item.updated)]);
        });
      },
      function (next)
      {
        d.getLatestItem(true, null, function (err, item)
        {
          if (err)
            return next(err);
          next(null, [
            createEntry('/', item && item.updated),
            createEntry('/projects', item && item.updated)
          ]);
        });
      }
    ],
    function (fn, next)
    {
      fn(next);
    },
    callback);
}

function buildEntries(callback)
{
  async.concat([
      buildMainEntries,
      buildProjectEntries,
      buildPageEntries
    ],
    function (fn, next)
    {
      fn(next);
    },
    callback);
}

function outputSitemap(req, res, next)
{
  buildEntries(function (err, entries)
  {
    if (err)
      return next(err);
    res.set('Content-Type', 'text/xml');
    req.data.sitemapEntries = entries;
    res.render('sitemap.xml', req.data);
  });
}

exports.outputSitemap = outputSitemap;