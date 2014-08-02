var jade = require('jade'),
  _ = require('lodash'),
  async = require('async'),
  renderers = exports.renderers = {},
  defaultType = 'raw',
  marked = require('marked'),
  swig = require('swig'),
  swigExtras = require('swig-extras'),
  format = require('util').format,
  config = require('../config/config');

function render(content, callback)
{
  if (!content || !content.data)
  {
    callback(null, '');
  }
  else
  {
    var renderer = renderers[content.dataType || defaultType];
    if (!renderer)
    {
      callback(new Error('Content type not supported: ' + content.dataType));
    }
    else
    {
      renderer(content, callback);
    }
  }
}
function renderFields(obj, fields, callback)
{
  var count = fields.length;
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
        if (!c)
          done();
        else
        {
          render(c, function (err, rendered)
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

exports.render = render;
exports.renderFields = renderFields;


renderers['raw'] = renderers['html'] = function (content, callback)
{
  callback(null, content.data || '');
};
renderers['jade'] = function (content, callback)
{
  var opts = _.extend({
    pretty: true
  }, content.renderOptions);
  jade.render(content.data, opts, callback);
};
renderers['md'] = function (content, callback)
{
  marked(content.data, {}, callback);
};

var swigFilters = _.merge(
  _.pick(swigExtras.filters, ['batch', 'groupby', 'markdown', 'nl2br', 'pluck', 'split', 'trim', 'truncate']),
  {
    prefix: function (input, str)
    {
      return input ? (str + input) : '';
    },
    suffix: function (input, str)
    {
      return input ? (input + str) : '';
    },
    format: function (input, var_args)
    {
      var args = _.toArray(arguments);
      args[0] = input.replace(/\$/g, '%');
      return format.apply(null, args);
    }
  });
var swigTags = _.merge(_.pick(swigExtras.tags, ['markdown', 'switch', 'case']),
  {

  });

exports.registerSwigFilters = function ()
{
  _.forOwn(swigFilters, function (f, key)
  {
    swig.setFilter(key, f);
  });
  _.forOwn(swigTags, function (t, key)
  {
    swig.setTag(key, t.parse, t.compile, t.ends, t.blockLevel);
    if (t.ext) {
      swig.setExtension(t.ext.name, t.ext.obj);
    }
  });
};

exports.prepareBannerUrl = function(url)
{
  if (url && !(/^https?:\/\//.test(url)))
  {
    var base = config.bannerImageBase;
    if (!base)
      return url;
    if (!/.*\/$/.test(base))
      base = base + '/';
    if (url.indexOf('/') == 0)
      url = url.substr(1);
    return base + url;
  }
  return url;
};
