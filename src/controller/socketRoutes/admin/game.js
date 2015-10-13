"use strict";

var _ = require("lodash");

var gameC = require.main.require("./core/game/controller/game");

module.exports = function (queryRoute) {
  queryRoute("game:create", function (data, cb) {
    if (typeof data.rings === "number") {
      gameC.addRings(data, data.rings || 0);
    } else {
      delete data.rings;
    }
    gameC.create(this, data, function (err, game) { cb(err, game); });
  });

  queryRoute("game:rings.replace", function (data, cb) {
    gameC.findById(this, data.id, function (err, game) {
      if (err != null) {
        return cb(err);
      }
      delete game.rings;
      gameC.addRings(game, data.rings || 0).save(cb);
    });
  });

  queryRoute("game:update", function (data, cb) {
    gameC.findById(this, data._id, function (err, game) {
      if (err != null) {
        return cb(err);
      }
      _.merge(game, _.omit(data, ["_id", "__v"]));
      game.save(function (err, game) { cb(err, game); });
    });
  });

  queryRoute("games:all", function (data, cb) { gameC.find(this, data, cb); });
};
