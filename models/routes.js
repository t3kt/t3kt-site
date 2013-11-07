
var util = require("./util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED,
  projects = require("./projects");

exports.registerRoutes = function(server)
{
  server.get('/projects/', function(req,res){
    res.render('projects/index.jade', {
      locals : {
        title : 'Projects'
        ,description: 'OMG PROJECTS!!!'
        ,author: 'tekt'
        ,analyticssiteid: 'XXXXXXX'
        ,projects: projects.list
      }
    });
  });
};
