var express = require('express'),
  path = require('path'),
  port = (process.env.PORT || 8081),
  routes = require('./app/routes'),
  admin = require('./app/admin/admin'),
  formage = require('formage'),
  config = require('./config/config'),
  models = require('./app/models'),
  adminEnabled = !!config.adminUser;

var app = express();
app.set('port', port);
app.set('mongo', config.mongoUri);

app.configure(function ()
{
  //app.use(express.bodyParser());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser('t3ktauth'));
  app.use(express.cookieSession({cookie: {maxAge: 1000 * 60 * 60 * 24}}));
  app.use(express.session());
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  routes.register(app);
//  admin.register(app);
  if (adminEnabled)
    formage.serve_static(app, express);
  app.use(app.router);
});

if (adminEnabled)
{
  var fAdmin = formage.init(app, express, models.models, {
    title: 'formage admin',
    default_section: 'Main',
    admin_users_gui: true,
    root: '/admin',
    username: config.adminUser,
    password: config.adminPass
  })
}

//app.use(function (req, res, next)
//{
//  var err = req.session.error,
//    msg = req.session.success;
//  delete req.session.error;
//  delete req.session.success;
//  res.locals.message = '';
//  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
//  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
//  next();
//});


function NotFound(msg)
{
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

app.listen(port);

console.log('Listening on http://localhost:' + port);