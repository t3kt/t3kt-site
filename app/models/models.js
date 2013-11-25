var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('lodash');

var tokenField = {type: String, lowercase: true, trim: true},
  dateField = {type: Date, default: Date.now},
  contentField = {
    dateType: tokenField,
    data: Schema.Types.Mixed,
    renderOptions: Schema.Types.Mixed
  };

var UserSchema = Schema({
  username: _.extend({}, tokenField, {unique: true}),
  password: String,
  salt: String,
  hash: String
});

var ProjectSchema = Schema({
  key: _.extend({}, tokenField, {unique: true}),
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
  key: _.extend({}, tokenField, {index: true}),
  project: tokenField,
  title: String,
  contentHtml: String,
  content: contentField,
  created: dateField,
  updated: dateField
});
PageSchema.index({key: 1, project: 1});

var imageField = {
  width: Number,
  height: Number,
  url: String
};

var ItemSchema = Schema({
  entityType: tokenField,
  key: tokenField,
  project: [tokenField],
  title: String,
  created: dateField,
  updated: dateField,
  tags: [tokenField],

  // external fields
  external: {
    source: tokenField,
    id: tokenField,
    url: String
  },

  // image / video fields
  thumb: imageField,

  // video fields
  embed: _.extend({}, imageField, { content: contentField }),

  // image fields
  image: imageField
});

module.exports = {
  UserSchema: UserSchema,
  ProjectSchema: ProjectSchema,
  PageSchema: PageSchema,
  ItemSchema: ItemSchema,

  User: mongoose.model('users', UserSchema),
  Project: mongoose.model('projects', ProjectSchema),
  Page: mongoose.model('pages', PageSchema),
  Item: mongoose.model('items', ItemSchema)
};


