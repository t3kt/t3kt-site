var mongoose = require('mongoose'),
  config = require('../../config/config'),
  _ = require('lodash'),
  models = require('./models');

mongoose.connect(config.mongoUri);

var User = exports.User = models.User,
  Project = exports.Project = models.Project,
  Page = exports.Page = models.Page;

exports.getProjects = function (callback)
{
  Project.find({}).sort('order key').exec(callback);
};
exports.getProject = function (key, callback)
{
  Project.findOne({key: key.toLowerCase()}).exec(callback);
};
exports.getPage = function (key, callback)
{
  Page.findOne({key: key.toLowerCase(), projectKey: {$exists: false}}).exec(callback);
};
exports.getProjectPage = function (projectKey, pageKey, callback)
{
  Page.findOne({key: pageKey.toLowerCase(), projectKey: projectKey.toLowerCase()}).exec(callback);
};

