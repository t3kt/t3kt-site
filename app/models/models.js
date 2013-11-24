var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('lodash');

var UserSchema = new Schema({
  username: String,
  password: String,
  salt: String,
  hash: String
});

var keyField = {type: String, lowercase: true, trim: true},
  dateField = {type: Date, default: Date.now};

var contentField = {
  dateType: keyField,
  data: Schema.Types.Mixed,
  renderOptions: Schema.Types.Mixed
};

var ProjectSchema = new Schema({
  key: keyField,
  title: String,
  blogCategories: [String],
  flickrSetId: String,
  vimeoAlbumId: String,
  githubRepo: String,
  summaryHtml: String,
  summary: contentField,
  descriptionHtml: String,
  description: contentField,
  created: dateField,
  updated: dateField
});

var PageSchema = Schema({
  key: keyField,
  projectKey: keyField,
  title: String,
  contentHtml: String,
  content: contentField,
  created: dateField,
  updated: dateField
});

function makeEntityType(type, fields)
{
  return new Schema(_.extend({
    entityType: _.extend(keyField, {default: type}),
    key: keyField,
    projectKey: keyField,
    created: dateField,
    updated: dateField
  }, fields));
}

module.exports = {
  UserSchema: UserSchema,
  ProjectSchema: ProjectSchema,
  PageSchema: PageSchema,

  User: mongoose.model('users', UserSchema),
  Project: mongoose.model('projects', ProjectSchema),
  Page: mongoose.model('pages', PageSchema)
};


