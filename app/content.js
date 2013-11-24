var jade = require('jade'),
  _ = require('lodash'),
  renderers = exports.renderers = {},
  defaultType = 'raw';

renderers['raw'] = function (content, callback)
{
  callback(null, content.data || '');
};
renderers['jade'] = function(content, callback)
{
  var opts = _.extend({
    pretty: true
  }, content.renderOptions);
  jade.render(content.data, opts, callback);
};

function render(content, callback)
{
  if (!content || !content.data)
  {
    callback(null, '');
  }
  else
  {
    var renderer = renderers[content.dateType || defaultType];
    if (!renderer)
    {
      callback(new Error('Content type not supported: ' + content.dateType));
    }
    else
    {
      renderer(content, callback);
    }
  }
}

exports.render = render;