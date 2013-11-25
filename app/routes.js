var util = require("../models/util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  d = require('./models'),
  config = require('../config/config');

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
    d.getProjects(function (err, projects)
    {
      if (err)
        next(err);
      else
      {
        req.data.projects = projects;
        next();
      }
    });
//    data.getProjects()
//      .done(function (projects)
//      {
//        req.data.projects = projects;
//        next();
//      })
//      .fail(next);
  },
  project: function (req, res, next)
  {
    var key = req.param('projectkey');
    if (!key)
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
      if (!req.data.project)
        next(new Error('project not found: ' + key));
      else
        next();
    }
    else
    {
      d.getProject(key, function (err, project)
      {
        if (err)
          next(err);
        else if (!project)
          next(new Error('project not found: ' + key));
        else
        {
          req.data.project = project;
          next();
        }
      });
    }
  },
  projectItems: function (req, res, next)
  {
    var key = req.param('projectkey'),
      itemType = req.param('itemtype');
    if (!key)
      next();
    else
      d.getProjectItems(key, itemType, function (err, items)
      {
        if (err)
          next(err);
        else
        {
          req.data.items = items;
          next();
        }
      });
  },
  page: function (req, res, next)
  {
    var projectKey = req.param('projectkey'),
      pageKey = req.param('pagekey');
    if (!pageKey)
      next();
    else if (projectKey)
    {
      d.getProjectPage(projectKey, pageKey, function (err, page)
      {
        if (err)
          next(err);
        else if (!page)
          next(new Error('page not found in project ' + projectKey + ': ' + pageKey));
        else
        {
          req.data.page = page;
          next();
        }
      });
    }
    else
    {
      d.getPage(pageKey, function (err, page)
      {
        if (err)
          next(err);
        else if (!page)
          next(new Error('page not found: ' + pageKey));
        else
        {
          req.data.page = page;
          next();
        }
      });
    }
  },
  newsItems: function (req, res, next)
  {
    var projectKey = req.param('projectkey'),
      category = req.param('category'),
      onResult = function (err, entries)
      {
        if (err)
          next(err);
        else
        {
          req.data.newsEntries = entries;
          next();
        }
      };
    if (projectKey)
      d.getProjectItems(projectKey, 'entry', onResult);
    else if (category)
      d.Item.find({entityType: 'entry', tags: category}, onResult);
    else
      d.getItems('entry', onResult);
  }
};

var routes =
{
  projects: route('get', '/projects',
    [needs.projectList],
    function (req, res)
    {
      req.data.title = 'projects';
      res.render('../views/projects/index.jade', req.data);
    }),
  projectsJson: route('get', '/projects.json',
    [needs.projectList],
    function (req, res)
    {
      res.json(req.data.projects);
    }),
  projectDetail: route('get', '/projects/:projectkey',
    [needs.projectList, needs.project],
    function (req, res)
    {
      req.data.title = 'project: ' + req.data.project.title;
      res.render('../views/projects/detail.jade', req.data);
    }),
  projectItems: route('get', '/projects/:projectkey/items',
    [needs.projectList, needs.project, needs.projectItems],
    function (req, res)
    {
      req.data.title = 'project: ' + req.data.project.title + ' : items';
      res.render('../views/items/items.jade', req.data);
    }),
  projectNews: route('get', '/projects/:projectkey/news',
    [needs.projectList, needs.project, needs.newsItems],
    function (req, res)
    {
      NOT_IMPLEMENTED();
    }),
  projectPage: route('get', '/projects/:projectkey/pages/:pagekey',
    [needs.projectList, needs.project, needs.page],
    function (req, res)
    {
      req.data.title = req.data.project.title + ': ' + req.data.page.title;
      res.render('../views/page.jade', req.data);
    }),
  page: route('get', '/pages/:pagekey',
    [needs.page],
    function (req, res)
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
    function (req, res)
    {
      req.data.title = 'news';
      res.render('../views/news/index.jade', req.data);
    }),
  newsCategory: route('get', '/news/category/:category',
    [needs.newsItems],
    function (req, res)
    {
      req.data.title = 'news: ' + req.param('category');
      res.render('../views/news/index.jade', req.data);
    })
};

exports.route = route;
exports.routes = routes;
exports.needs = needs;

function sharedInit(req, res, next)
{
  req.data = req.data || {};
  req.data.isAjax = req.xhr || req.param('ajax') === '1';
  req.data.analyticsSiteId = config.analyticsSiteId;
  req.data.analyticsDomain = config.analyticsDomain;
  next();
}

exports.registerRoutes = function (app, routes)
{
  Object.keys(routes).forEach(function (routeId)
  {
    var route = routes[routeId],
      verbs = util.asArray(route.verb),
      paths = util.asArray(route.path);
    verbs.forEach(function (verb)
    {
      paths.forEach(function (path)
      {
        app[verb](path,
          [
            sharedInit,
            function (req, res, next)
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

exports.register = function (app)
{
  exports.registerRoutes(app, routes);
};