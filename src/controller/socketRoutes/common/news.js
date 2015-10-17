"use strict";

var _ = require("lodash");

var gameM = require.main.require("./core/game/model/game");
var newsM = require.main.require("./core/news/model/news");

module.exports = function (queryRoute) {
  queryRoute("news:global", function (data, cb) {
    newsM.find({game: null}).populate("author game").exec(function (err, news) {
      if (err != null) {
        return cb(err);
      }
      cb(null, _.map(news, function (n) {
        return _.extend(_.omit(n._doc, ["author", "game"]), {
          author: _.pick(n.author._doc, ["_id", "username"]),
          game: n.game ? _.pick(n.game._doc, ["_id", "name"]) : null
        });
      }));
    });
  });

  queryRoute("news:game", function (data, cb) {
    gameM.findOne({active: true}, {kills: 1}).populate("kills.murderer kills.victim").exec(function (err, game) {
      if (err != null) {
        return cb(err);
      }
      newsM.find({game: game._id}).populate("author").exec(function (err, news) {
        if (err != null) {
          return cb(err);
        }
        var kills = _.sortByOrder(game.kills, ["entryDate"], ["desc"]);
        if (typeof data === "number" && data > 0) {
          kills = _.slice(kills, 0, data);
        }
        cb(null, {
          kills: _.map(kills, function (k) {
            return _.extend(_.omit(k._doc, ["murderer", "victim"]), {
              murderer: k.murderer ? _.pick(k.murderer._doc, ["_id", "username"]) : null,
              victim: _.pick(k.victim._doc, ["_id", "username"])
            });
          }),
          special: _.map(news, function (n) {
            return _.extend(_.omit(n._doc, ["author"]), {author: _.pick(n.author._doc, ["_id", "username"])});
          })
        });
      });
    });
  });
};
