"use strict";

var _ = require("lodash");

var GROUPS = []; // TODO rework with db-groups

var gameM = require.main.require("./core/game/model");

var cTrue = _.constant(true);
var arrayGen = function () { return []; };

module.exports = function (queryRoute) {
  queryRoute("stats:game.deaths", function (data, cb) { // TODO move logic into controller, q-based
    gameM.findOne({active: true}, {kills: 1}, function (err, game) {
      if (err != null) {
        return cb(err);
      }
      if (game == null) {
        return cb(new Error("Game not found."));
      }
      var data = {kills: [], suicides: []};
      _.each(game.kills, function (kill) {
        if (kill.murderer == null) {
          data.suicides.push(_.pick(kill._doc, ["_id", "entryDate"]));
        } else {
          data.kills.push(_.pick(kill._doc, ["_id", "entryDate", "ring"]));
        }
      });
      cb(null, data);
    });
  });

  queryRoute("stats:game.users", function (data, cb) { // TODO move logic into controller, q-based
    gameM.findOne({active: true}).populate("participants").exec(function (err, game) {
      if (err != null) {
        return cb(err);
      }
      if (game == null) {
        return cb(new Error("Game not found."));
      }
      var rings = game.rings.length;
      var groupByUser = {};
      var userData = {}, groupData = {}, groupOrder = _.pluck(GROUPS, "name");
      var result = {
        rings: rings,
        usersTotal: game.participants.length,
        users: userData,
        groups: groupData,
        groupOrder: groupOrder
      };
      _.each(GROUPS, function (g) { groupData[g.name] = {active: 0, kills: 0}; });
      _.each(game.participants, function (p) {
        if (!groupData.hasOwnProperty(p.group)) {
          groupOrder.push(p.group);
          groupData[p.group] = {active: 0, kills: 0};
        }
        userData[p._id] = _.extend({
          active: _.times(rings, cTrue),
          kills: _.times(rings, arrayGen) // [[victim_ring_0, victim_ring_0, ...], ...]
        }, _.pick(p._doc, ["_id", "username"]));
        groupByUser[p._id] = p.group;
      });
      _.each(game.rings, function (ring, idx) {
        _.each(ring.kills, function (kill) {
          if (kill.murderer != null) {
            userData[kill.murderer].kills[idx].push(_.pick(kill._doc, ["victim", "entryDate"]));
            groupData[groupByUser[kill.murderer]].kills++;
          }
          userData[kill.victim].active[idx] = false;
        });
      });
      _.each(game.participants, function (p) {
        var lives = 0;
        _.each(userData[p._id].active, function (val) {
          if (val) {
            lives++;
          }
        });
        groupData[p.group].active += lives;
      });
      cb(null, result);
    });
  });
};
