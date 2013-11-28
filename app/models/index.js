var mongoose = require('mongoose'),
  config = require('../../config/config'),
  _ = require('lodash'),
  models = require('./models');

mongoose.connect(config.mongoUri);

var User = exports.User = models.User,
  Project = exports.Project = models.Project,
  Page = exports.Page = models.Page,
  Item = exports.Item = models.Item,
  Settings = exports.Settings = models.Settings;
exports.models = {
  User: User,
  Project: Project,
  Page: Page,
  Item: Item,
  Settings: Settings
};

exports.userExists = function (username, callback)
{
  User.count({ username: username }, function (err, count)
  {
    if (err)
      callback(err);
    else
      callback(null, count !== 0);
  });
};

exports.getUser = function (username, callback)
{
  User.findOne({username: username}, callback);
}

exports.getProjects = function (projectKeys, callback)
{
  if (_.isFunction(projectKeys))
  {
    callback = projectKeys;
    projectKeys = null;
  }
  Project.find(projectKeys ? {key: {$in: projectKeys}} : {}).sort('order key').exec(callback);
};
exports.getProject = function (key, callback)
{
  Project.findOne({key: key.toLowerCase()}).exec(callback);
};
exports.getPage = function (key, callback)
{
  Page.findOne({key: key.toLowerCase(), project: {$exists: false}}).exec(callback);
};
exports.getProjectPage = function (projectKey, pageKey, callback)
{
  Page.findOne({key: pageKey.toLowerCase(), project: projectKey.toLowerCase()}).exec(callback);
};

exports.getProjectItems = function (projectKey, itemType, callback)
{
  var query = {project: projectKey.toLowerCase()};
  if (itemType)
    query.entityType = Item.resolveType(itemType);
  Item.find(query).exec(callback);
};
exports.getItems = function (itemType, callback)
{
  Item.find({entityType: Item.resolveType(itemType)}).exec(callback);
};
exports.getItem = function (key, callback)
{
  Item.findOne({key: key.toLowerCase()}).exec(callback);
};

exports.getSettings = function (callback)
{
  Settings.findOne({}, callback);
};

