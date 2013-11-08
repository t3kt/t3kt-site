
var _ = require('lodash'),
  E = require("./entities"),
  external = require('./external'),
  Deferred = require("Deferred"),
  util = require("./util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  _ = require("lodash");

function Project(props)
{
  if( !(this instanceof Project) )
    return new Project(props);
  this.blogCategories = [];
  _.extend(this, props);
  this.thumb = this.thumb && E.image.size(this.thumb);
}
Project.prototype = {
  key:null,
  title:null,
  descriptionHtml:null,
  summaryHtml:null,
  blogCategories:[],
  mainImage:null,
  flickrSetId:null,
  vimeoAlbumId:null,
  githubRepo:null,
  thumb:null
};

Project.prototype.getImages=function() {
  return Deferred.when( !this.flickrSetId ? [] : external.flickr.getPhotosetPhotos(this.flickrSetId) );
};
Project.prototype.getVideos=function() {
  return Deferred.when( !this.vimeoAlbumId ? [] : external.vimeo.getAlbumVideos(this.vimeoAlbumId) );
};
Project.prototype.getBlogEntries=function() {
  return Deferred.when( (!this.blogCategories||!this.blogCategories.length)?[]:external.blogger.getBlogEntries(this.blogCategories));
};
Project.prototype.getCommits = function() {
  return Deferred.when( !this.githubRepo ? [] : external.github.getRepoCommits(this.githubRepo));
};
Project.prototype.getAllItems = function()
{
  return Deferred.when( this.getVideos(), this.getImages(), this.getCommits(), this.getBlogEntries() )
    .pipe(function(videos, images, commits, entries)
    {
      var items = _.flatten([videos, images, commits, entries]);
      items.sort(function(a,b)
      {
        return -util.compare(+a.posted, +b.posted);
      });
      return items;
    })
};
Project.prototype.getAllItemBatches = function()
{
  return this.getAllItems()
    .pipe(function(items)
    {
      var batches = [],
        batch,
        currentType;
      items.forEach(function(item)
      {
        if(batch && item.entityType == batch.type)
        {
          batch.items.push(item);
        }
        else
        {
          batches.push(batch = {type: item.entityType, items: [item]});
        }
      });
      return batches;
    });
};

function batchItems(items)
{
  NOT_IMPLEMENTED();
}

module.exports = Project;