var util = require("./util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  d = require('./models'),
  config = require('../config/config'),
  async = require('async'),
  getVimeoEmbed = require('./vimeoembed').getEmbed,
  _ = require('lodash'),
  content = require('./content'),
  meta = require('./meta');

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
        req.data.bannerUrl = content.prepareBannerUrl(settings.defaultBannerUrl);
        next();
      }
    });
  },
  projectList: function (req, res, next)
  {
    d.Project.find().sort('-created').exec(
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
          if (project.bannerUrl)
          {
            project.prepareBannerFields();
            req.data.bannerUrl = project.bannerFullUrl || project.bannerUrl;
          }
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
          if (project.bannerUrl)
          {
            project.prepareBannerFields();
            req.data.bannerUrl = project.bannerUrl;
          }
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
      var query = d.Item.find({project: key});
      if (Array.isArray(itemType))
        query = query.where('entityType').in(itemType);
      else if (itemType)
        query = query.where('entityType').equals(itemType);
      query.sort('-created').exec(function (err, items)
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
          req.data.items = entries;
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
  projects: route('get', ['/projects', '/'],
    [needs.settings, needs.projectList],
    function (req, res, next)
    {
      async.map(req.data.projects,
        function (project, done)
        {
          project.prepareBannerFields();
          project.renderContent(['summary', 'description'], done);
        },
        function (err, projects)
        {
          if (err)
            return next(err);
          req.data.projects = projects;
          req.data.title = 'projects';
          res.render('projects/project-list.jade', req.data)
          //res.render('projects/index.html', req.data);
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
      req.data.project.prepareBannerFields();
      req.data.project.renderContent(['summary', 'description'], function (err, project)
      {
        if (err)
          return next(err);
        req.data.project = project;
        req.data.title = 'project: ' + req.data.project.title;
        req.data.pageParams = {projectKey: project.key};
        //req.data.pageParamsJson = JSON.stringify(req.data.pageParams);
        req.data.navPathParts = [
          {url: '/', name: 'projects'},
          {name: project.title}
        ];
        res.render('projects/project-detail.jade', req.data);
        //res.render('projects/detail.html', req.data);
      });
    }),
  projectItems: route('get',
    [
      '/projects/:projectkey/items'
    ]
      .concat(Object.keys(d.Item.types).map(function (t)
      {
        return '/projects/:projectkey/' + t;
      }))
    ,
    [needs.settings, needs.projectList, needs.project, needs.projectItems],
    function (req, res)
    {
      req.data.isContentOnly = req.data.isAjax;
      if (!req.data.isContentOnly)
      {
        req.data.navPathParts = [
          {url: '/', name: 'projects'},
          {name: req.data.project.title}
        ];
      }
      res.render('items.html', req.data);
    }),
  projectItemBatches: route('get', '/projects/:projectkey/itembatches',
    [needs.settings, needs.projectList, needs.project, needs.projectItems],
    function (req, res)
    {
      req.data.isContentOnly = req.data.isAjax;
      if (!req.data.isContentOnly)
      {
        req.data.navPathParts = [
          {url: '/', name: 'projects'},
          {name: req.data.project.title}
        ];
      }
      req.data.items = util.batchItems(req.data.items,
        {
          postProcessBatch: function (b)
          {
            if (b.items.length == 1)
              return b.items[0];
            b.items = b.items.map(function (i)
            {
              return i.toObject();
            });
            return b;
          }
        });
      res.render('items.html', req.data);
    }),
  projectItemBatchesJson: route('get', '/projects/:projectkey/itembatches.json',
    [needs.projectItems],
    function (req, res)
    {
      req.data.items = util.batchItems(req.data.items,
        {
          postProcessBatch: function (b)
          {
            if (b.items.length == 1)
              return b.items[0];
            return b;
          }
        });
      res.json(req.data.items);
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
    [needs.settings, needs.projectList, needs.project, needs.page, needs.projectPages],
    function (req, res)
    {
      req.data.page.renderContent(['content'], function (err, page)
      {
        if (!req.data.isContentOnly)
        {
          req.data.navPathParts = [
            {url: '/', name: 'projects'},
            {url: '/projects/' + req.data.project.key, name: req.data.project.title},
            {name: page.title}
          ];
        }
        req.data.page = page;
        res.render('page.html', req.data);
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
        res.render('page.html', req.data);
      });
    }),
  news: route('get',
    [
      '/news'
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
      res.render('news.html', req.data);
    }),
  newsCategory: route('get', '/news/category/:category',
    [needs.settings, needs.newsItems],
    function (req, res)
    {
      req.data.title = 'news: ' + req.param('category');
      res.render('news.html', req.data);
    }),
  itemJson: route('get', '/item/:itemkey.json',
    [needs.item],
    function (req, res)
    {
      res.json(req.data.item);
    }),
  timelineTest: route('get', '/timelinetest', null,
    function (req, res)
    {
      res.render('timelinetest.html');
    }),
  sitemap: route('get', '/sitemap',
    [needs.projectList],
    function (req, res, next)
    {
      meta.outputSitemap(req, res, next);
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
    analyticsDomain: config.analyticsDomain,
    analyticsEnabled: config.analyticsEnabled,
    siteTitle: config.siteTitle,
    siteAuthor: config.siteAuthor,
    appRootUrl: config.appRootUrl
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
              res.set('X-ROUTE-ID', routeId);
              res.set('X-ROUTE-PATH', path);
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