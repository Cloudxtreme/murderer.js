"use strict";

var _ = require("lodash");
var Q = require("q");

var gameM = require.main.require("./core/game/model");
var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("games:all", function () { return gameC.qFindWithAccess(this); });

  queryRoute("games:joined", function () { return gameC.qFindJoined(this); });

  queryRoute("game:join", function (data) {
    if (typeof data !== "object" || data == null || typeof data.gameId !== "string" || typeof data.name !== "string" || !data.name.length || typeof data.message !== "string" || !data.message.length || typeof data.groupId !== "string") {
      return Q.reject("Bad request.");
    }
    return gameC.qJoin(this, data.gameId, data.name, data.message, data.groupId);
  });

  queryRoute("game:leave", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad request."); }
    return gameC.qLeave(this, data);
  });

  queryRoute("game:contracts", function (data, cb) { // TODO move logic into game controller, q-based
    var scope = this;
    var userId = scope.user._id;
    gameM.findOne({active: true}).populate("rings.active.user").exec(function (err, game) {
      if (err != null) {
        return cb(err);
      }
      if (game == null) {
        return cb(new Error("Game not found."));
      }
      if (!_.some(game.participants, function (p) { return p.equals(userId); })) {
        return cb(new Error("Not participating."));
      }
      var result = {};
      result.game = _.pick(game, ["name"]);
      result.rings = _.map(game.rings, function (ring, index) {
        var r = {ring: index};
        if (ring.active.length <= 1) {
          r.resolved = true;
          r.lastSurvivor = ring.active.length ? _.pick(ring.active[0].user, ["_id", "username"]) : null;
          return r;
        }
        var idx = _.findIndex(ring.active, function (obj) { return obj.user._id.equals(userId); });
        if (~idx) {
          var mission = ring.active[idx + 1 < ring.active.length ? idx + 1 : 0].user;
          r.active = true;
          r.token = ring.active[idx].token;
          r.mission = _.pick(mission, ["_id", "username", "profileMessage"]);
        }
        return r;
      });
      cb(null, result);
    });
  });
};
