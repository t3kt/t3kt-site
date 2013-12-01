var util = require("./util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  d = require('./models'),
  config = require('../config/config'),
  async = require('async'),
  getVimeoEmbed = require('./vimeoembed').getEmbed,
  _ = require('lodash');

function route(verb, path, middleware, handler)
{
  handler.verb = verb;
  handler.path = path;
  handler.middleware = middleware || [];
  return handler;
}

var needs = {
  settings: function (req, res, next)
  {
    d.getSettings(function (err, settings)
    {
      if (err)
        next(err);
      else
      {
        req.data.settings = settings;
        next();
      }
    });
  },
  projectList: function (req, res, next)
  {
    d.Project.find().sort('-posted').exec(
      function (err, projects)
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
    {
      var query = {project: key};
      if (itemType)
        query.entityType = itemType;
      d.Item.find(query).sort('-created').exec(function (err, items)
      {
        if (err)
          next(err);
        else
        {
          if (itemType)
            req.data.itemType = itemType;
          req.data.items = items;
          next();
        }
      });
    }
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
      query = {entityType: d.Item.types.blogentry};
    if (projectKey)
      query.project = projectKey;
    if (category)
      query.tags = category;
    d.Item.find(query).sort('-created').exec(
      function (err, entries)
      {
        if (err)
          next(err);
        else
        {
          req.data.newsEntries = entries;
          next();
        }
      });
  },
  item: function (req, res, next)
  {
    var itemKey = req.param('itemkey');
    if (!itemKey)
      next();
    else
    {
      d.getItem(itemKey, function (err, item)
      {
        if (err)
          next(err);
        else if (!item)
          next(new Error('item not found: ' + itemKey));
        else
        {
          req.data.item = item;
          next();
        }
      })
    }
  },
  projectPages: function (req, res, next)
  {
    var projectKey = req.param('projectkey');
    d.Page.find({project: projectKey}).sort('key').exec(
      function (err, pages)
      {
        if (err)
          next(err);
        else
        {
          req.data.projectPages = pages;
          next();
        }
      });
  }
};

var routes =
{
  projects: route('get', ['/projects'],
    [needs.settings, needs.projectList],
    function (req, res, next)
    {
      async.map(req.data.projects,
        function (project, done)
        {
          project.renderContent(['summary', 'description'], done);
        },
        function (err, projects)
        {
          if (err)
            return next(err);
          req.data.projects = projects;
          req.data.title = 'projects';
          res.render('../views/projects/index.jade', req.data);
        });
    }),
  projectsJson: route('get', '/projects.json',
    [needs.projectList],
    function (req, res)
    {
      res.json(req.data.projects);
    }),
  projectDetail: route('get', '/projects/:projectkey',
    [needs.settings, needs.projectList, needs.project, needs.projectPages],
    function (req, res, next)
    {
      req.data.project.renderContent(['summary', 'description'], function (err, project)
      {
        if (err)
          return next(err);
        req.data.project = project;
        req.data.title = 'project: ' + req.data.project.title;
        res.render('../views/projects/detail.jade', req.data);
      });
    }),
  projectItems: route('get', '/projects/:projectkey/items',
    [needs.settings, needs.projectList, needs.project, needs.projectItems],
    function (req, res)
    {
      req.data.title = 'project: ' + req.data.project.title + ' : items';
      res.render('../views/items/items.jade', req.data);
    }),
  projectItemBatches: route('get', '/projects/:projectkey/itembatches',
    [needs.settings, needs.projectList, needs.project, needs.projectItems],
    function (req, res)
    {
      req.data.title = 'project ' + req.data.project.title + ' : items';
      req.data.itemBatches = util.batchItems(req.data.items);
      res.render('../views/items/itemBatches.jade', req.data);
    }),
  projectItemsOfType: route('get', '/projects/:projectkey/:itemtype',
    [needs.settings, needs.projectList, needs.project, needs.projectItems],
    function (req, res)
    {
      req.data.title = 'project: ' + req.data.project.title + ' : ' + req.data.itemType;
      res.render('../views/items/items.jade', req.data);
    }),
  videoEmbed: route('get', '/video/:itemkey/embed',
    [needs.settings, needs.item],
    function (req, res, next)
    {
      var video = req.data.item,
        params = req.query;
      getVimeoEmbed(video, params, function (err, embed)
      {
        if (err)
          next(err);
        else
        {
          res.type('html');
          res.send(embed.html);
        }
      });
    }),
  projectPage: route('get', '/projects/:projectkey/pages/:pagekey',
    [needs.settings, needs.projectList, needs.project, needs.page],
    function (req, res)
    {
      req.data.page.renderContent(['content'], function (err, page)
      {
        req.data.page = page;
        req.data.title = req.data.project.title + ': ' + req.data.page.title;
        res.render('../views/page.jade', req.data);
      });
    }),
  page: route('get', '/pages/:pagekey',
    [needs.settings, needs.page],
    function (req, res, next)
    {
      req.data.page.renderContent(['content'], function (err, page)
      {
        if (err)
          return next(err);
        req.data.page = page;
        req.data.title = page.title;
        res.render('../views/page.jade', req.data);
      });
    }),
  news: route('get',
    [
      '/news', '/'
    ],
    [needs.settings, needs.newsItems],
    function (req, res)
    {
      req.data.title = 'news';
//      async.eachSeries(req.data.newsEntries,
//      function(entry, next))
//      {
//        entry.renderContent(['content'],next);
//      }
      res.render('../views/news/index.jade', req.data);
    }),
  newsCategory: route('get', '/news/category/:category',
    [needs.settings, needs.newsItems],
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
  req.data = _.merge({
    isAjax: req.xhr || req.param('ajax') === '1' || !!req.header('X-PJAX'),
    analyticsSiteId: config.analyticsSiteId,
    analyticsDomain: config.analyticsDomain
  }, req.data || {});
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