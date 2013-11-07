// entities.js

var _ = require('lodash');

function Entity(props)
{
  return _.extend(this, props);
}
Entity.prototype = {
  id: null,
  title: null,
  posted: null,
  detailUrl: null
};

function Video(props)
{
  this.entityType = 'video';
  Entity.call(this, props);
}
Video.prototype = new Entity({
  entityType: 'video',
  thumbPath: null,
  embedWidth: null,
  embedHeight: null,
  embedHtml: null
});

function Image(props)
{
  this.entityType = 'image';
  Entity.call(this, props);
}
Image.prototype = new Entity({
  entityType: 'image',
  thumb: null,
  full: null
});
function ImageSize(props)
{
  _.extend(this, props);
}
ImageSize.prototype = {
  url: null,
  width: null,
  height: null
};

function Commit(props)
{
  this.entityType = 'commit';
  Entity.call(this, props);
}
Commit.prototype = new Entity({
  entityType: 'commit'
});

function BlogEntry(props)
{
  this.entityType = 'blogEntry';
  this.categories = [];
  Entity.call(this, props);
}
BlogEntry.prototype = new Entity({
  entityType: 'blogEntry',
  categories: [],
  contentHtml: null
});


exports.video = function (props)
{
  return new Video(props);
};

exports.image = function (props)
{
  return new Image(props);
};

exports.image.size = function (props)
{
  return new ImageSize(props);
};

exports.commit = function (props)
{
  return new Commit(props);
};

exports.blogEntry = function (props)
{
  return new BlogEntry(props);
};