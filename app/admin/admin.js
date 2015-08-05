var util = require("../util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  models = require('../models'),
  config = require('../../config/config'),
  hash = require('../pass').hash,
  User = models.User,
  routes = require('../routes'),
  route = routes.route,
  needs = routes.needs,
  pull = require('./pull'),
  async = require('async');


function authenticate(name, pass, callback)
{
  if (!module.parent) console.log('authenticating %s:%s', name, pass);

  models.getUser(name,
    function (err, user)
    {
      if (user)
      {
        if (err) return callback(new Error('cannot find user'));
        hash(pass, user.salt, function (err, hash)
        {
          if (err) return callback(err);
          if (hash == user.hash) return callback(null, user);
          callback(new Error('invalid password'));
        });
      }
      else
      {
        return callback(new Error('cannot find user'));
      }
    });
}

var adminNeeds = exports.needs = {
  authenticated: function (req, res, next)
  {
    if (req.session.user)
    {
      req.data.user = req.session.user;
      next();
    }
    else
    {
      req.session.error = 'Access denied!';
      res.redirect('/admin/login');
    }
  },
  registrationAllowed: function (req, res, next)
  {
    if (!config.registrationAllowed)
      next(new Error('registration not allowed'));
    else
      next();
  },
  userDoesNotExist: function (req, res, next)
  {
    models.userExists(req.body.username, function (err, exists)
    {
      if (exists)
      {
        req.session.error = "User Exist";
        res.redirect("/admin/signup");
      }
      else
        next(err);
    });
  }
};


var adminRoutes = exports.routes = {
  signup_form: route('get', '/admin/signup',
    [adminNeeds.registrationAllowed],
    function (req, res)
    {
      if (req.session.user)
        res.redirect('/admin');
      else
        res.render('admin/signup.html');
    }),
  signup: route('post', '/admin/signup',
    [adminNeeds.registrationAllowed, adminNeeds.userDoesNotExist],
    function (req, res)
    {
      var password = req.body.password;
      var username = req.body.username;

      hash(password, function (err, salt, hash)
      {
        if (err) throw err;
        new User({
          username: username,
          salt: salt,
          hash: hash,
        }).save(function (err, newUser)
          {
            if (err) throw err;
            authenticate(newUser.username, password, function (err, user)
            {
              if (!err)
                throw err;
              if (user)
              {
                req.session.regenerate(function ()
                {
                  req.session.user = user;
                  req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/admin/logout">logout</a>. ' + ' You may now access <a href="/admin">/restricted</a>.';
                  res.redirect('/admin');
                });
              }
            });
          });
      });
    }),
  login_form: route('get', '/admin/login', [],
    function (req, res)
    {
      res.render('admin/login.html');
    }),
  login: route('post', '/admin/login', [],
    function (req, res)
    {
      authenticate(req.body.username, req.body.password, function (err, user)
      {
        if (!err)
          throw err;
        if (user)
        {
          req.session.regenerate(function ()
          {

            req.session.user = user;
            req.session.success = 'Authenticated as ' + user.username + ' click to <a href="/admin/logout">logout</a>. ' + ' You may now access <a href="/admin">/restricted</a>.';
            res.redirect('/admin');
          });
        }
        else
        {
          req.session.error = 'Authentication failed, please check your ' + ' username and password.';
          res.redirect('/admin/login');
        }
      });
    }),
  dashboard: route('get', '/admin',
    [adminNeeds.authenticated], function (req, res)
    {
      req.data.title = 'admin';
      res.render('admin/index.html', req.data);
    }),
  pullForm: route('get', '/admin/pull',
    [adminNeeds.authenticated, needs.projectList], function(req, res) {
        req.data.title = 'pull';
        var sources = Object.keys(pull.sources);
        sources.sort();
        req.data.sources = sources;
        res.render('admin/pull.html', req.data);
    }),
  doPull: route('post', '/admin/pull',
    [adminNeeds.authenticated], function(req, res, next) {
        req.data.title = 'pull results';
        var sources = req.body.source;
        if (sources == 'all' || !sources) {
          sources = Object.keys(pull.sources);
        } else if (!Array.isArray(sources)) {
          sources = [sources];
        }
        var projectKeys = req.body.projects;
        if (projectKeys == 'all' || !projectKeys) {
          projectKeys = null;
        } else if (!Array.isArray(projectKeys)) {
          projectKeys = [projectKeys];
        }
        models.getProjects(projectKeys,
          function (err, projects) {
            if (err) {
              return next(err);
            }
            var results = [];
            async.eachSeries(sources,
              function (source, nextSource) {
                pull(source, projects, {},
                  function (err, report) {
                    if (err) {
                      results.push_back({type:'error', error: err});
                      return nextSource(err);
                    }
                    if (report) {
                      results.push_back({type:'report', report:report});
                    }
                    nextSource();
                  });
              },
              function (err) {
                if (err) {
                  // return next(err);
                  req.data.error = err;
                }
                req.data.results = results;
                req.render('admin/pull-results.html');
              });
          });
    })
};

exports.register = function (app)
{
  routes.registerRoutes(app, adminRoutes);
};
