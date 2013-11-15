// Generated by CoffeeScript 1.6.3
(function() {
  var DbFacade, NOT_IMPLEMENTED, db, util;

  util = require('./util');

  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED;

  db = require('./db');

  DbFacade = {
    getProjects: db.getProjects,
    getProject: db.getProject,
    getItems: db.getItems,
    getItemsByType: function(type) {
      return this.getItems({
        type: type
      });
    },
    getItem: db.getItem,
    getProjectItems: function(projectKey, type) {
      var query;
      query = {
        project: projectKey
      };
      if (type) {
        query.type = type;
      }
      return this.getItems(query);
    },
    getProjectItemBatches: function(projectKey) {
      return this.getProjectItems(projectKey).pipe(function(items) {
        return util.batchItems(items);
      });
    },
    getPage: db.getPage,
    getProjectPage: function(projectKey, pageKey) {
      return this.getPage("" + projectKey + ":" + pageKey);
    }
  };

  module.exports = DbFacade;

}).call(this);
