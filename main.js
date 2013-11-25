var express = require('express'),
  path = require('path'),
  port = (process.env.PORT || 8081),
  routes = require('./app/routes'),
  admin = require('./app/admin/admin');

var app = express();

app.configure(function ()
{
  app.use(express.bodyParser());
  app.use(express.cookieParser('t3ktauth'));
  app.use(express.session());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  routes.register(app);
  admin.register(app);
});


app.use(function (req, res, next)
{
  var err = req.session.error,
    msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});


function NotFound(msg)
{
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

app.listen(port);

console.log('Listening on http://localhost:' + port);