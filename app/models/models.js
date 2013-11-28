var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('lodash'),
  formage = require('formage'),
  content = require('../content');

var tokenField = {type: String, lowercase: true, trim: true},
  dateField = {type: Date, default: Date.now, widget: formage.widgets.DateTimeWidget},
  requiredDateField = _.extend({}, dateField, {required: true}),
  contentField = {
    dataType: _.merge({}, tokenField, {enum: [''].concat(Object.keys(content.renderers))}),
    data: Schema.Types.Text,
    renderOptions: Schema.Types.Mixed
  };

function renderContentFields(fields, callback)
{
  content.renderFields(this, fields, callback);
}

var SettingsSchema = Schema({
  defaultBannerUrl: String
});

var UserSchema = Schema({
  username: _.extend({}, tokenField, {required: true, unique: true}),
  password: String,
  salt: String,
  hash: String
});

var ProjectSchema = Schema({
  key: _.extend({}, tokenField, {required: true, unique: true}),
  title: {type: String, required: true},
  blogCategories: [String],
  flickrSetId: String,
  vimeoAlbumId: String,
  githubRepo: String,
  summary: contentField,
  description: contentField,
  created: dateField,
  updated: dateField,
  bannerUrl: String
});
ProjectSchema.methods.renderContent = renderContentFields;

var PageSchema = Schema({
  key: _.extend({}, tokenField, {index: true}),
  project: tokenField,
  title: {type: String, required: true},
  content: contentField,
  created: dateField,
  updated: dateField
});
PageSchema.index({key: 1, project: 1});
PageSchema.methods.renderContent = renderContentFields;

var imageField = {
  width: Number,
  height: Number,
  url: String
};

var itemTypes =
{
  video: 'video',
  image: 'image',
  commit: 'commit',
  blogEntry: 'blogEntry'
};
var itemTypeAliases =
  _.merge({}, itemTypes,
    {
      videos: 'video',
      images: 'image',
      commits: 'commit',
      blogEntries: 'blogEntry',
      news: 'blogEntry'
    });

var ItemSchema = Schema({
  entityType: _.extend({}, tokenField, {required: true, enum: Object.keys(itemTypes)}),
  key: _.extend({}, tokenField, {required: true}),
  project: [tokenField],
  title: {type: String, required: true},
  created: dateField,
  updated: dateField,
  tags: [tokenField],

  // external fields
  external: {
    source: tokenField,
    id: tokenField,
    url: String,
    pulled: dateField,
    data: Schema.Types.Mixed
  },

  // image / video fields
  thumb: imageField,

  // video fields
  embed: _.extend({}, imageField, { content: contentField }),

  // image fields
  full: imageField,
  small: imageField,
  square: imageField,
  medium: imageField
});
ItemSchema.methods.renderContent = renderContentFields;

var User = mongoose.model('users', UserSchema),
  Project = mongoose.model('projects', ProjectSchema),
  Page = mongoose.model('pages', PageSchema),
  Item = mongoose.model('items', ItemSchema),
  Settings = mongoose.model('settings', SettingsSchema);

Item.types = itemTypes;
Item.resolveType = function (type)
{
  return type && (itemTypeAliases[type.toLowerCase()]);
};

module.exports = exports = {
  SettingsSchema: SettingsSchema,
  UserSchema: UserSchema,
  ProjectSchema: ProjectSchema,
  PageSchema: PageSchema,
  ItemSchema: ItemSchema,

  Settings: Settings,
  User: User,
  Project: Project,
  Page: Page,
  Item: Item
};


