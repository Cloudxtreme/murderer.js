"use strict";

var _ = require("lodash");
var Q = require("q");

var model = require("../model/game");
var socket = require.main.require("./controller/socket");
var ctrlBase = require("../../../utils/controllerBase");
var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;
var userC = require.main.require("./core/user/controller/user");

ctrlBase(model, module.exports);

function isTokenInUse(game, token) {
  return _.any(game.rings, function (ring) {
    var tokens = _.pluck(ring.active, "token");
    return _.contains(tokens, token);
  });
}

function getRingInstance(game, user) {
  var token;
  do {
    token = security.generateToken(config.security.humanToken.bytes).toUpperCase();
  } while (isTokenInUse(game, token));
  return {user: user, token: token};
}

function qSave(game) {
  var defer = Q.defer();
  game.save(function (err, data) {
    if (err == null) {
      defer.resolve(data);
    } else {
      defer.reject(err);
    }
  });
  return defer.promise;
}

function trackKill(game, ring, ringIdx, entry) {
  ring.kills.push(entry);
  game.kills.push(_.extend({ring: ringIdx}, entry));
}

function performTokenKill(user, game, ringIdx, activeIdx, message) {
  var ring = game.rings[ringIdx], active = ring.active, obj = active[activeIdx];
  active.splice(activeIdx, 1);
  var entry = {
    entryDate: Date.now(),
    murderer: user._id,
    victim: obj.user,
    message: message,
    token: obj.token
  };
  trackKill(game, ring, ringIdx, entry);
  tidyInactive(ring.inactive, entry.murderer, entry.victim);
  updateInactive(ring.inactive, entry.murderer, entry.victim);
  return game;
}

function performInactiveTokenKill(game, ringIdx, inactiveIdx, message) {
  var ring = game.rings[ringIdx], inactive = ring.inactive, obj = inactive[inactiveIdx];
  inactive.splice(inactiveIdx, 1);
  var entry = {
    entryDate: Date.now(),
    murderer: obj.murderer,
    victim: obj.victim,
    message: message,
    token: obj.token
  };
  trackKill(game, ring, ringIdx, entry);
  tidyInactive(inactive, entry.murderer, entry.victim);
  return game;
}

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

/**
 * Removes all entries from inactive the murderer was only allowed to kill before the given victim.
 * @param inactive The inactive list (game.rings[].inactive).
 * @param murderer The murderer who may missed to kill inactive users.
 * @param victim The victim who just got killed.
 */
function tidyInactive(inactive, murderer, victim) {
  var obj;
  var max = inactive.length;
  for (var i = 0; i < max; i++) {
    obj = inactive[i];
    if (obj.murderer.equals(murderer) && obj.nextVictim.equals(victim)) {
      inactive.splice(i, 1);
      max--;
      i = 0;
      victim = obj.victim;
    }
  }
}

module.exports.addRings = function (game, amount) {
  if (!(game.rings instanceof Array)) {
    game.rings = [];
  }
  while (amount--) {
    game.rings.push({active: _.map(_.shuffle(game.participants), _.partial(getRingInstance, game))});
  }
  return game;
};

function aaa(entry, game) {
  socket.broadcastCommonPermitted("news:update.game", entry);
  return game;
}

function aba(scope, entry, game) {
  var defer = Q.defer();
  userC.findById(scope, entry.victim, function (err, v) {
    if (err == null) {
      entry.victim = v != null ? _.pick(v._doc, ["_id", "username"]) : null;
      defer.resolve(aaa(entry, game));
    } else {
      defer.reject(err);
    }
  });
  return defer.promise;
}

module.exports.killByToken = function (scope, user, game, token, message) {
  var rings = game.rings, ring, active, inactive, obj, i, j;
  var newsObj = {
    entryDate: new Date(),
    message: message,
    token: token,
    murderer: _.pick(user, ["_id", "username"])
  };
  for (i = 0; i < rings.length; i++) {
    ring = rings[i];
    active = ring.active;
    if (active.length > 1) {
      for (j = 0; j < active.length; j++) {
        obj = active[j];
        if (obj.token === token && active[(j === 0 ? active.length : j) - 1].user.equals(user._id)) {
          scope.log.info({token: token}, "valid token");
          return Q
              .when(performTokenKill(user, game, i, j, message))
              .then(qSave)
              .then(_.partial(aba, scope, _.extend(newsObj, {ring: i, victim: obj.user})));
        }
      }
    }
    inactive = ring.inactive;
    for (j = 0; j < inactive.length; j++) {
      obj = inactive[j];
      if (obj.token === token && obj.murderer.equals(user._id)) {
        return Q
            .when(performInactiveTokenKill(game, i, j, message))
            .then(qSave)
            .then(_.partial(aba, scope, _.extend(newsObj, {ring: i, victim: obj.user})));
      }
    }
  }
  scope.log.warn({token: token}, "invalid token");
  return Q.reject(new Error("Invalid token."));
};

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

module.exports.killSelf = function (scope, user, game, message) {
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
            userC.sendMailByKey(scope, "game.newMission", predecessor.user,
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
              userC.sendMailByKey(scope, "game.admin.newMissions", admin, {info: message});
            });
          });
        });
    game.kills.push(_.extend({ring: null}, entry));
    return qSave(game).then(_.partial(aaa, {
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
