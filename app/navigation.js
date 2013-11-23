var _ = require('lodash'),
  util = require('../models/util'),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  data = require('../models/data');

var topLevelItems = [
  new NavEntry('about', 'about', '/pages/about'),
  new NavEntry('news', 'news', '/news'),
  new NavEntry('projects', 'projects', '/projects')
];

function NavEntry(id, text, url, opts)
{
  if(arguments.length == 1 && typeof(id)!='string')
  {
    _.extend(this, id);
  }
  else
  {
    this.id = id;
    this.text = text;
    this.url = url;
  }
}
NavEntry.prototype.load = function(loadChildren)
{
  if(this.items)
  {
  }
};

function getNavItems(contextId)
{
  var topLevelItems = [
    new NavEntry('about', 'about', '/pages/about'),
    new NavEntry('news', 'news', '/news'),
    new NavEntry('projects', 'projects', '/projects')
  ];
  NOT_IMPLEMENTED();
}
