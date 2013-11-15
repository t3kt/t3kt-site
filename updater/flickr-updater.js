// Generated by CoffeeScript 1.6.3
(function() {
  var Deferred, Flickr, FlickrUpdater, NOT_IMPLEMENTED, SourceUpdater, config, createItem, db, moment, sourceKey, typeKey, util, _ref,
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

  Flickr = require("node-flickr");

  typeKey = 'image';

  sourceKey = 'flickr';

  FlickrUpdater = (function(_super) {
    __extends(FlickrUpdater, _super);

    function FlickrUpdater() {
      _ref = FlickrUpdater.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FlickrUpdater.typeKey = typeKey;

    FlickrUpdater.sourceKey = sourceKey;

    FlickrUpdater.prototype.createDefinition = function() {
      return {
        key: sourceKey,
        types: [typeKey],
        config: {
          apiKey: config.flickrApiKey,
          extras: 'date_taken,owner_name,tags,o_dims,path_alias,url_sq,url_t,url_s,url_m,url_o,path_alias'
        }
      };
    };

    FlickrUpdater.prototype.updateProject = function(project) {
      var flickr, _ref1, _ref2,
        _this = this;
      if (!project.flickrSetId) {
        return Deferred.when();
      } else {
        flickr = new Flickr({
          api_key: ((_ref1 = this.source) != null ? (_ref2 = _ref1.config) != null ? _ref2.apiKey : void 0 : void 0) || config.flickrApiKey
        });
        return Deferred(function(dfd) {
          return flickr.get('photosets.getPhotos', {
            photoset_id: project.flickrSetId,
            extras: _this.source.extras
          }, function(result) {
            var photo, results;
            if (result.stat !== 'ok') {
              return dfd.reject(result);
            } else {
              results = (function() {
                var _i, _len, _ref3, _ref4, _results;
                _ref4 = result != null ? (_ref3 = result.photoset) != null ? _ref3.photo : void 0 : void 0;
                _results = [];
                for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                  photo = _ref4[_i];
                  _results.push(db.asyncFindOne('items', [
                    {
                      type: typeKey,
                      source: sourceKey,
                      externalId: photo.id
                    }
                  ]).pipe(function(exists) {
                    var image;
                    if (exists) {
                      return;
                    }
                    image = createItem(typeKey, sourceKey, photo.id, {
                      detailUrl: "http://www.flickr.com/photos/" + (photo.path_alias || result.photoset.owner) + "/" + photo.id + "/",
                      posted: moment(photo.datetaken).toDate(),
                      full: {
                        height: photo.height_o,
                        width: photo.width_o,
                        url: photo.url_o
                      },
                      thumb: {
                        height: photo.height_s,
                        width: photo.width_s,
                        url: photo.url_s
                      },
                      projects: [project.key]
                    });
                    return db.insertItem(image);
                  }));
                }
                return _results;
              })();
              return util.whenAll(results);
            }
          });
        });
      }
    };

    return FlickrUpdater;

  })(SourceUpdater);

  module.exports = FlickrUpdater;

}).call(this);