var _ = require('lodash'),
  util = require('./util'),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  config = require('../config/config'),
  async = require('async'),
  d = require('./models'),
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
  return date && moment(date).format('YYYY-MM-DDThh:mmTZD');
}

function buildProjectEntries(callback)
{
  NOT_IMPLEMENTED();
}

function buildPageEntries(callback)
{
  NOT_IMPLEMENTED();
}

function buildMainEntries(callback)
{
  var entries = [
    createEntry('/'),
    createEntry('/projects'),
    createEntry('/news')
  ];
  NOT_IMPLEMENTED();
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