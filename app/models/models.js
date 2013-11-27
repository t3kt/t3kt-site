var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  _ = require('lodash'),
  formage = require('formage'),
  content = require('../content'),
  async = require('async');

var tokenField = {type: String, lowercase: true, trim: true},
  dateField = {type: Date, default: Date.now, widget: formage.widgets.DateTimeWidget},
  requiredDateField = _.extend({}, dateField, {required: true}),
  contentField = {
    dataType: _.extend({}, tokenField, {enum: [''].concat(Object.keys(content.renderers))}),
    data: Schema.Types.Text,
    renderOptions: Schema.Types.Mixed
  };

function renderContentFields(fields, callback)
{
  var count = fields.length,
    obj = this;
  if (obj.toObject)
    obj = obj.toObject();
  else
    obj = _.extend({}, obj);
  if (count == 0)
    callback(null, obj);
  else
  {
    async.each(fields,
      function (field, done)
      {
        var c = obj[field];
        if (!c && obj[field + 'Html'])
          c = {dataType: 'html', data: obj[field + 'Html']};
        if (!c)
          done();
        else
        {
          content.render(c, function (err, rendered)
          {
            if (err)
              done(err);
            else
            {
              obj[field + 'Rendered'] = rendered;
              done();
            }
          });
        }
      },
      function (err)
      {
        if (err)
          callback(err);
        else
          callback(null, obj);
      });
  }
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
  summaryHtml: {type: Schema.Types.Html},
  summary: contentField,
  descriptionHtml: {type: Schema.Types.Html},
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
  contentHtml: {type: Schema.Types.Html},
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



