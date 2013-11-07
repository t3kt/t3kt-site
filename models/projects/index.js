var Project = require("../project"),
  NOT_IMPLEMENTED = require("../util").NOT_IMPLEMENTED;

exports.projects = {};
exports.list = [];

[
  require("./Flow.json"),
  require("./DynamicStructure.json"),
  require("./LinearChaosC.json"),
  require("./LinearChaosB.json"),
  require("./LinearChaosA.json"),
  require("./QW2.json"),
  require("./LCloud.json")
].forEach(function (props)
  {
    var project = Project(props);
    exports.projects[project.id.toLowerCase()] = Project(props);
    exports.list.push(project);
  });
exports.get = function(id){
  var project = exports.projects[ (id||'').toLowerCase() ];
  if(!project)
  {
    NOT_IMPLEMENTED();
  }
  return project;
};


