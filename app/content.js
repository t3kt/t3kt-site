var jade = require('jade'),
  _ = require('lodash'),
  async = require('async'),
  renderers = exports.renderers = {},
  defaultType = 'raw',
  marked = require('marked');

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
        if (!c && obj[field + 'Html'])
          c = {dataType: 'html', data: obj[field + 'Html']};
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
renderers['md'] = function(content, callback)
{
  marked(content.data, {}, callback);
};
