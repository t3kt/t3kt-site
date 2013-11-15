var util = require("../models/util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  data = require('../models/data');

//function Route(verb, path, middleware, handler)
//{
//  this.verbs = Array.isArray(verb) ? verb : [verb];
//  if(Array.isArray(path))
//  {
//    this.paths = path;
//    this.path = path[0];
//  }
//  else
//  {
//    this.paths = [path];
//    this.path = path;
//  }
//  this.middleware = middleware;
//  this.handler = handler;
//}
//Route.prototype.register = function(app)
//{
//  var verbs = this.verbs,
//    middleware = this.middleware,
//    handler = this.handler;
//  this.paths.forEach(function(path)
//  {
//    verbs.forEach(function(verb)
//    {
//      app[verb](path, middleware, handler);
//    });
//  });
//};

function route(verb, path, middleware, handler)
{
  handler.verb = verb;
  handler.path = path;
  handler.middleware = middleware || [];
  return handler;
}

var needs = {
  projectList: function (req, res, next)
  {
    data.getProjects()
      .done(function(projects)
      {
        req.data.projects = projects;
        next();
      })
      .fail(next);
  },
  project: function (req, res, next)
  {
    var key = req.param('projectkey');
    if(!key)
      next(new Error('no project key'));
    else if (req.data.projects)
    {
      var project;
      key = key.toLowerCase();
      for (var i = 0; i < req.data.projects.length; i++)
      {
        project = req.data.projects[i];
        if (project.key && project.key.toLowerCase() == key)
        {
          req.data.project = project;
          break;
        }
      }
      if(!req.data.project)
        next(new Error('project not found: ' + key));
      else
        next();
    }
    else
    {
      data.getProject(key.toLowerCase())
        .done(function(proj)
        {
          req.data.project = proj;
          next();
        })
        .fail(next);
    }
  },
  projectItems: function(req, res, next)
  {
    var key = req.param('projectkey'),
      itemType = req.param('itemtype');
    if(!key)
      next();
    else
      data.getProjectItems(key, itemType)
        .done(function(items)
        {
          req.data.items = items;
          next();
        })
        .fail(next);
  },
  page: function(req, res, next)
  {
    var projectKey = req.param('projectkey'),
      pageKey = req.param('pagekey');
    if(!pageKey)
      next();
    else if(projectKey)
    {
      data.getProjectPage(projectKey, pageKey)
        .done(function(page)
        {
          if(!page)
            next(new Error('page not found in project ' + projectKey + ': ' + pageKey));
          else
          {
            req.data.page = page;
            next();
          }
        })
        .fail(next);
    }
    else
    {
      data.getPage(pageKey)
        .done(function(page)
        {
          if(!page)
            next(new Error('page not found: ' + pageKey));
          else
          {
            req.data.page = page;
            next();
          }
        })
        .fail(next);
    }
  },
  newsItems: function(req, res, next)
  {
    var projectKey = req.param('projectkey'),
      category = req.param('category');
    if(projectKey)
      data.getProjectItems(projectKey, 'entry')
        .done(function(entries)
        {
          req.data.newsEntries = entries;
          next();
        })
        .fail(next);
    else if(category)
      data.getItems({type: 'entry', categories: category})
        .done(function(entries)
        {
          req.data.newsEntries = entries;
          next();
        })
        .fail(next);
    else
      data.getItemsByType('entry')
        .done(function(entries)
        {
          req.data.newsEntries = entries;
          next();
        })
        .fail(next);
  }
};

var routes =
{
  projects: route('get', '/projects',
    [needs.projectList],
    function(req, res)
    {
      req.data.title = 'projects';
      res.render('../views/projects/index.jade', req.data);
    }),
  projectDetail: route('get', '/projects/:projectkey',
    [needs.projectList, needs.project],
    function(req, res)
    {
      req.data.title = 'project: ' + req.data.project.title;
      res.render('../views/projects/detail.jade', req.data);
    }),
  projectItems: route('get', '/projects/:projectkey/items',
    [needs.projectList, needs.project, needs.projectItems],
    function(req, res)
    {
      req.data.title = 'project: ' + req.data.project.title +' : items';
      res.render('../views/items/items.jade', req.data);
    }),
  projectNews: route('get', '/projects/:projectkey/news',
    [needs.projectList, needs.project, needs.newsItems],
    function(req, res)
    {
      NOT_IMPLEMENTED();
    }),
  projectPage: route('get', '/projects/:projectkey/pages/:pagekey',
    [needs.projectList, needs.project, needs.page],
    function(req, res)
    {
      NOT_IMPLEMENTED();
    }),
  page: route('get', '/pages/:pagekey',
    [needs.page],
    function(req, res)
    {
      req.data.title = req.data.page.title;
      res.render('../views/page.jade', req.data);
    }),
  news: route('get',
    [
      '/news',
      '/'
    ],
    [needs.newsItems],
    function(req, res)
    {
      req.data.title = 'news';
      res.render('../views/news/index.jade', req.data);
    }),
  newsCategory: route('get', '/news/category/:category',
    [needs.newsItems],
    function(req, res)
    {
      NOT_IMPLEMENTED();
    })
};

exports.route = route;
exports.routes = routes;
exports.needs = needs;

function sharedInit(req, res, next)
{
  req.data = req.data || {};
  req.data.isAjax = req.xhr || req.param('ajax') === '1';
  next();
}

exports.register = function(app)
{

  Object.keys(routes).forEach(function(routeId)
  {
    var route = routes[routeId],
      verbs = util.asArray(route.verb),
      paths = util.asArray(route.path);
    verbs.forEach(function(verb)
    {
      paths.forEach(function(path)
      {
        app[verb](path,
          [
            sharedInit,
            function(req,res,next)
            {
              req.data.routePath = path;
              req.data.routeId = routeId;
              next();
            },
            route.middleware
          ], route);
      });
    });
  });
};