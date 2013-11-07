var util = require("../models/util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  projects = require("../models/projects"),
  _ = require("lodash");

function itemRouteByProject(method, render)
{
  return function (req, res, id)
  {
    var project = projects.get(id);
    project[method]()
      .done(function(items){
        render(req, res, items);
      });
  };
}
function itemRouteByProjectHtml(method)
{
  return itemRouteByProject(method, function (req, res, items)
  {
    res.render('items/items.jade', {
      items: items
    });
  });
}
function itemJsonRouteByProject(method)
{
  return itemRouteByProject(method, function (req, res, items)
  {
    res.json(items);
  });
}

module.exports = {
  get_videos_id: itemRouteByProjectHtml('getVideos'),
  get_commits_id: itemRouteByProjectHtml('getCommits'),
  get_news_id: itemRouteByProjectHtml('getBlogEntries'),
  get_images_id: itemRouteByProjectHtml('getImages'),
  get_id: itemRouteByProjectHtml('getAllItems'),
  get_videos_id_json: itemJsonRouteByProject('getVideos'),
  get_commits_id_json: itemJsonRouteByProject('getCommits'),
  get_news_id_json: itemJsonRouteByProject('getBlogEntries'),
  get_images_id_json: itemJsonRouteByProject('getImages'),
  get_id_json: itemJsonRouteByProject('getAllItems'),
  get_batches_id_json: itemJsonRouteByProject('getAllItemBatches')
};