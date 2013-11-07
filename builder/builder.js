
var config = require("../config/config"),
  Deferred = require("Deferred"),
  moment = require("moment"),
  E = require("../models/entities"),
  util = require("../models/util"),
  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED;

function Builder(opts)
{
  this.buildAll = function()
  {
    NOT_IMPLEMENTED();
  };
  this.buildProject = function(id)
  {
    NOT_IMPLEMENTED();
  };
}

function buildAll()
{
  NOT_IMPLEMENTED();
}

function buildProject(id)
{
  NOT_IMPLEMENTED();
}

exports.buildAll = function(opts)
{
  var b = new Builder(opts);
  b.buildAll();
};
exports.buildProject = function(id, opts)
{
  var b = new Builder(opts);
  b.buildProject(id);
};

