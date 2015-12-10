"use strict";

var _ = require("lodash");
var Q = require("q");
var socket = require.main.require("./controller/socket");
var config = require.main.require("./utils/config").main;
var userC = require.main.require("./core/user/controller");

// TODO adapt to new structure

/*===================================================== Exports  =====================================================*/

exports.commit = function (scope, user, game, message) {
  var userId = user._id, rings = game.rings, ring, active, inactive, obj, predecessor, successor, i, j;
  var wasActive = false;
  var predecessors = [];
  var entry = {
    entryDate: Date.now(),
    murderer: null,
    victim: userId,
    message: message,
    token: null
  };
  for (i = 0; i < rings.length; i++) {
    ring = rings[i];
    active = ring.active;
    inactive = ring.inactive;
    for (j = 0; j < active.length; j++) {
      obj = active[j];
      if (active[j].user.equals(userId)) {
        wasActive = true;
        active.splice(j, 1);
        predecessor = active.length === 0 ? null : active[(j === 0 ? active.length : j) - 1];
        successor = active.length === 0 ? null : active[(j === active.length ? 0 : j)];
        if (predecessor) {
          updateInactive(inactive, predecessor.user, userId);
          predecessors.push({ring: i, userId: predecessor.user, missionId: successor.user});
        }
        inactive.push({
          murderer: predecessor && predecessor.user,
          victim: userId,
          nextVictim: getNextVictim(inactive, successor && successor.user, userId),
          token: obj.token
        });
        ring.kills.push(entry);
        break;
      }
    }
  }
  if (wasActive) {
    Q
        .all(_.map(predecessors, function (predecessor) {
          return Q.all([
            qFindUserById(scope, predecessor.userId).then(function (user) { predecessor.user = user; }),
            qFindUserById(scope, predecessor.missionId).then(function (user) { predecessor.mission = user; })
          ]).then(_.constant(predecessor));
        }))
        .then(function (predecessors) {
          // TODO fix fdg got mission to kill fdg when second-last user commits suicide
          _.each(predecessors, function (predecessor) {
            userC.qSendMailByKey(scope, predecessor.user, "game.newMission",
                {
                  game: game.name,
                  link: config.server.url + "contracts",
                  ring: predecessor.ring,
                  user: predecessor.user._doc,
                  mission: predecessor.mission._doc
                });
          });
          return predecessors;
        })
        .then(function (predecessors) {
          var message = _.map(predecessors, function (predecessor) {
            // TODO replace with fdg is last alive if predecessor.missionId.equals(predecessor.userId)
            return "User '" + predecessor.user.username + "' (" + predecessor.userId + ") got the mission to kill '" +
                predecessor.mission.username + "' (" + predecessor.missionId + ") in ring " + predecessor.ring +
                " of game '" + game.name + "'.";
          }).join("\n");
          userC.findByModulePermission("admin", function (err, admins) {
            _.each(admins, function (admin) {
              // TODO send link to print especially those missions
              userC.qSendMailByKey(scope, admin, "game.admin.newMissions", {info: message});
            });
          });
        });
    game.kills.push(_.extend({ring: null}, entry));
    return qSave(game).then(_.partial(broadcastUpdate, {
      entryDate: new Date(),
      message: message,
      token: null,
      murderer: null,
      victim: _.pick(user, ["_id", "username"])
    })).then(function (game) {
      scope.log.warn({game: game}, "committed suicide");
      return game;
    });
  }
  return Q.reject(new Error("Not active."));
};

/*==================================================== Functions  ====================================================*/

function qSave(game) { return Q.nbind(game.save, game)(); } // TODO attach q-methods within modelBase

/**
 * Updates the inactive list so the murderer extends the victims victims.
 * @param inactive The inactive list (game.rings[].inactive).
 * @param murderer The murderer who may needs to extend new inactive victims.
 * @param victim The victim who just got killed.
 */
function updateInactive(inactive, murderer, victim) {
  _.each(inactive, function (obj) {
    if (obj.murderer.equals(victim)) {
      obj.murderer = murderer;
    }
  });
}

function broadcastUpdate(entry, game) {
  socket.broadcastCommonPermitted("news:update.game", entry);
  return game;
}

function getNextVictim(inactive, successor, victim) {
  var obj, i;
  for (i = 0; i < inactive.length; i++) {
    obj = inactive[i];
    if (obj.murderer.equals(victim)) {
      successor = obj.victim;
      break;
    }
  }
  if (successor) {
    for (i = 0; i < inactive.length; i++) {
      if (obj.nextVictim.equals(successor)) {
        successor = obj.victim;
        i = 0;
      }
    }
  }
  return successor;
}

var qFindUserById = Q.denodeify(userC.findById);
