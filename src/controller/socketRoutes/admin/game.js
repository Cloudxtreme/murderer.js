"use strict";

var _ = require("lodash");

var GROUPS = []; // TODO rework with db-groups

var gameC = require.main.require("./core/game/controller");
var gameM = require.main.require("./core/game/model");

module.exports = function (queryRoute) {
  queryRoute("games:all", function (data) { return gameC.qFind(this, data); });

  queryRoute("game:create", function (data) { return gameC.qCreate(this, data); });

  queryRoute("game:details", function (data) { return gameC.qPopulated(data); });

  queryRoute("game:update", function (data) { return gameC.qFindByIdAndUpdate(this, {_id: data._id}, data); });

  queryRoute("game:rings.set", function (data) { return gameC.qGenerateRings(this, data.gameId, data.amount); });

  /////////// TODO overwork

  queryRoute("game:contracts.all", function (data, cb) {
    gameM.findOne({_id: data}).populate("rings.active.user participants").exec(function (err, game) {
      if (game == null) {
        return cb(new Error("Game not found."));
      }
      var result = {
        game: _.extend(_.pick(game, ["name"]), {rings: game.rings.length}),
        participants: _.map(game.participants, function (p) { return _.pick(p, ["_id", "usernameLower", "group"]); }),
        groups: GROUPS,
        resolved: _.compact(_.map(game.rings, function (ring, index) {
          if (ring.active.length <= 1) {
            return {
              ring: index,
              survivor: ring.active.length ? _.pick(ring.active[0].user, ["_id", "username", "usernameLower", "group"]) : null
            };
          }
        })),
        contracts: _.flatten(_.map(game.rings, function (ring, index) {
          if (ring.active.length <= 1) {
            return [];
          }
          var missions = [], prev = ring.active[ring.active.length - 1];
          _.each(ring.active, function (obj) {
            missions.push({
              ring: index,
              token: prev.token,
              mission: _.pick(obj.user, ["_id", "username", "usernameLower", "profileMessage"]),
              murderer: _.pick(prev.user, ["_id", "username", "usernameLower", "group", "profileMessage"])
            });
            prev = obj;
          });
          return missions;
        }))
      };
      cb(null, result);
    });
  });
};
