
var config = require("../../config/config"),
  Deferred = require("Deferred"),
  moment = require("moment"),
  E = require("../entities"),
  util = require("../util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  requestAsync = util.requestAsync,
  Cache = require("mem-cache"),
  cache = new Cache(config.cacheTimeout);

exports.getBlogEntries = function(categories)
{
  var cached = cache.get('all');
  if(cached)
  {
    return Deferred.when(filterEntries(cached, categories));
  }

  return requestAsync('http://tetk.blogspot.com/feeds/posts/default?alt=json')
    .pipe(function(body){
      var data = JSON.parse(body),
        entries = data.feed.entry
          .map(convertEntry);
      cache.set('all', entries);
      return filterEntries(entries, categories);
    });
};

function filterEntries(entries, categories)
{
  if(categories && !categories.length)
    categories = null;
  return entries.filter(function(entry)
  {
    if(categories)
    {
      if(!entry.categories || !entry.categories.some(function(c){return categories.indexOf(c)!=-1;}))
        return false;
    }
    return true;
  });
}

function convertEntry(entry)
{
  return E.blogEntry({
    key: entry.id.$t,
    posted: moment(entry.published.$t),
    categories: (entry.category||[]).map(function(c){return c.term;}),
    title:entry.title.$t,
    contentHtml: entry.content.$t
  });
}