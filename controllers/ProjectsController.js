
var util = require("../models/util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  projects = require("../models/projects"),
  ItemsController = require("./ItemsController");

module.exports = {

  get_index: function(req, res)
  {
    res.render('projects/index.jade', {
      currentContext: '/projects',
      title : 'Projects',
      description: 'OMG PROJECTS!!!',
      author: 'tekt',
      analyticssiteid: 'XXXXXXX',
      projects: projects.list
    })
  },

  get_id : function(req, res, id)
  {
    var project = projects.get(id);
    project.getAllItemBatches()
      .done(function(batches){
        res.render('projects/detail.jade', {
          currentContext: '/projects/' + id,
          title: 'Project: ' + project.title,
          author: 'tekt',
          project: project,
          projectItemBatches: batches,
          projects: projects.list
        });
      })
      .fail(function(err)
      {
        throw new Error('ERROR getting project items ' + err);
      });
  },

  get_id_images:ItemsController.get_images_id,
  get_id_commits:ItemsController.get_commits_id,
  get_id_news:ItemsController.get_news_id,
  get_id_videos:ItemsController.get_videos_id,
  get_id_items:ItemsController.get_id
};