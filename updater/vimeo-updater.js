// Generated by CoffeeScript 1.6.3
(function() {
  var Deferred, NOT_IMPLEMENTED, SourceUpdater, VimeoUpdater, config, createItem, db, moment, sourceKey, typeKey, util, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require('../config/config');

  util = require('../models/util');

  NOT_IMPLEMENTED = util.NOT_IMPLEMENTED;

  db = require('../models/db');

  moment = require('moment');

  Deferred = require('Deferred');

  SourceUpdater = require('./index').SourceUpdater;

  createItem = require('./index').createItem;

  typeKey = 'video';

  sourceKey = 'vimeo';

  VimeoUpdater = (function(_super) {
    __extends(VimeoUpdater, _super);

    function VimeoUpdater() {
      _ref = VimeoUpdater.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    VimeoUpdater.typeKey = typeKey;

    VimeoUpdater.sourceKey = sourceKey;

    VimeoUpdater.prototype.createDefinition = function() {
      return {
        key: sourceKey,
        types: [typeKey],
        config: {
          embedBase: '//player.vimeo.com/video/',
          embedParams: 'portrait=0&badge=0&byline=0'
        }
      };
    };

    VimeoUpdater.prototype.updateProject = function(project) {
      var _this = this;
      if (!project.vimeoAlbumId) {
        return Deferred.when();
      } else {
        return requestAsync("http://vimeo.com/api/v2/album/" + albumId + "/videos.json").pipe(function(body) {
          var results, video, videos;
          videos = JSON.parse(body);
          results = (function() {
            var _i, _len, _results,
              _this = this;
            _results = [];
            for (_i = 0, _len = videos.length; _i < _len; _i++) {
              video = videos[_i];
              _results.push(db.asyncFindOne('items', [
                {
                  type: typeKey,
                  source: sourceKey,
                  externalId: video.id
                }
              ]).pipe(function(exists) {
                var embedSize, vid;
                if (exists) {
                  return;
                }
                embedSize = util.limitSize(video, {
                  width: 400
                });
                vid = createItem(typeKey, sourceKey, video.id, {
                  title: video.title,
                  posted: moment(video.upload_date).toDate(),
                  detailUrl: video.url,
                  thumb: {
                    width: embedSize.width,
                    height: embedSize.height,
                    url: video.thumbnail_large
                  },
                  embed: {
                    width: embedSize.width,
                    height: embedSize.height,
                    url: "" + _this.source.config.embedBase + video.id + "?" + _this.source.config.embedParams
                  }
                });
                return db.insertItem(vid);
              }));
            }
            return _results;
          }).call(_this);
          return util.whenAll(results);
        });
      }
    };

    return VimeoUpdater;

  })(SourceUpdater);

  module.exports = VimeoUpdater;

}).call(this);
