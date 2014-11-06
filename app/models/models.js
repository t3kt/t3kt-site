var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('lodash'),
  formage = require('formage'),
  content = require('../content'),
  moment = require('moment');

var tokenField = {type: String, lowercase: true, trim: true},
  dateField = {type: Date, default: Date.now, widget: formage.widgets.DateTimeWidget},
  contentField = {
    dataType: _.merge({}, tokenField, {enum: [''].concat(Object.keys(content.renderers))}),
    data: Schema.Types.Text,
    renderOptions: Schema.Types.Mixed
  },
  navItemField = {
    url: String,
    text: String,
    external: Boolean
  };

function renderContentFields(fields, callback)
{
  content.renderFields(this, fields, callback);
}

function renderDateField(field)
{
  return (this[field] && moment(this[field]).format('YYYY.MM.DD HH:mm:ss')) || '';
}

function prepareBannerField(field)
{
  this[field] = content.prepareBannerUrl(this[field]);
}
function prepareBannerFields()
{
  prepareBannerField.call(this, 'bannerUrl');
  prepareBannerField.call(this, 'bannerFullUrl');
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
  bannerUrl: String,
  bannerFullUrl: String,
  navItems: [navItemField]
});
ProjectSchema.methods.renderContent = renderContentFields;
ProjectSchema.methods.renderDate = renderDateField;
ProjectSchema.methods.prepareBannerFields = prepareBannerFields;

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
PageSchema.methods.renderDate = renderDateField;


var imageField = {
  width: Number,
  height: Number,
  url: String
};

var itemTypes = {
  video: 'video',
  image: 'image',
  commit: 'commit',
  blogentry: 'blogentry',
  event: 'event'
};
var itemTypeAliases =
  _.merge({}, itemTypes, {
    videos: 'video',
    images: 'image',
    commits: 'commit',
    blogentries: 'blogentry',
    news: 'blogentry'
  });

var ItemSchema = Schema({
  entityType: _.extend({}, tokenField, {required: true, enum: Object.keys(itemTypes)}),
  key: _.extend({}, tokenField, {required: true}),
  project: [tokenField],
  title: {type: String},
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
  medium: imageField,

  // blog/news entry fields
  content: contentField,

  // event fields
  date: dateField
});
ItemSchema.methods.renderContent = renderContentFields;
ItemSchema.methods.renderDate = renderDateField;

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
  EventSchema: EventSchema,

  Settings: Settings,
  User: User,
  Project: Project,
  Page: Page,
  Item: Item
};



