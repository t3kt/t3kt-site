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
  return User.count({ username: username }, function (err, count)
  {
    if (err)
      callback(err);
    else
      callback(null, count !== 0);
  });
};

exports.getUser = function (username, callback)
{
  return User.findOne({username: username}, callback);
};

exports.getProjects = function (projectKeys, callback)
{
  if (_.isFunction(projectKeys))
  {
    callback = projectKeys;
    projectKeys = null;
  }
  return Project.find(projectKeys ? {key: {$in: projectKeys}} : {}).sort('order key').exec(callback);
};
exports.getProject = function (key, callback)
{
  return Project.findOne({key: key}, callback);
};
exports.getPage = function (key, callback)
{
  return Page.findOne({key: key, $or: [{project: { $exists: false}}, {project:""}]}, callback);
};
exports.getProjectPage = function (projectKey, pageKey, callback)
{
  return Page.findOne({key: pageKey, project: projectKey}, callback);
};

exports.getProjectItems = function (projectKey, itemType, callback)
{
  var query = {project: projectKey};
  if (itemType)
    query.entityType = Item.resolveType(itemType);
  return Item.find(query, callback);
};
exports.getItems = function (itemType, callback)
{
  return Item.find({entityType: Item.resolveType(itemType)}, callback);
};
exports.getItem = function (key, callback)
{
  return Item.findOne({key: key}, callback);
};

exports.getSettings = function (callback)
{
  return Settings.findOne({}, callback);
};

