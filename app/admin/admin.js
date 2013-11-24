var util = require("../../models/util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  models = require('../models'),
  config = require('../../config/config'),
  hash = require('../pass').hash,
  User = models.User,
  routes = require('../routes'),
  route = routes.route,
  needs = routes.needs;


function authenticate(name, pass, fn)
{
  if (!module.parent) console.log('authenticating %s:%s', name, pass);

  User.findOne({
      username: name
    },

    function (err, user)
    {
      if (user)
      {
        if (err) return fn(new Error('cannot find user'));
        hash(pass, user.salt, function (err, hash)
        {
          if (err) return fn(err);
          if (hash == user.hash) return fn(null, user);
          fn(new Error('invalid password'));
        });
      }
      else
      {
        return fn(new Error('cannot find user'));
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
    User.count({
      username: req.body.username
    }, function (err, count)
    {
      if (count === 0)
      {
        next();
      }
      else
      {
        req.session.error = "User Exist";
        res.redirect("/admin/signup");
      }
    });
  }
}


var adminRoutes = exports.routes = {
  signup_form: route('get', '/admin/signup',
    [adminNeeds.registrationAllowed],
    function (req, res)
    {
      if (req.session.user)
        res.redirect('/admin');
      else
        res.render('../views/admin/signup.jade');
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
      res.render('../views/admin/login.jade');
    }),
  login: route('post', '/admin/login', [],
    function (req, res)
    {
      authenticate(req.body.username, req.body.password, function (err, user)
      {
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
      })
    }),
  dashboard: route('get', '/admin',
    [adminNeeds.authenticated], function (req, res)
    {
      req.data.title = 'admin';
      res.render('../views/admin/index.jade', req.data);
    })
};

exports.register = function (app)
{
  routes.registerRoutes(app, adminRoutes);
};
