
var connect = require('connect'),
  express = require('express'),
  controllers = require('express-controller'),
  port = (process.env.PORT || 8081);

var app = express();

app.set('views', __dirname + '/views');
app.set('view options', { layout: false });
app.use(connect.static( __dirname + '/public'));
app.use(app.router);

function NotFound(msg){
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

controllers
  .setDirectory( __dirname + '/controllers' )
  .bind(app);


app.listen(port);

console.log('Listening on http://localhost:' + port );