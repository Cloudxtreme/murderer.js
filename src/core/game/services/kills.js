"use strict";

var _ = require("lodash");
var Q = require("q");
var socket = require.main.require("./controller/socket");
var userC = require.main.require("./core/user/controller");

// TODO adapt to new structure

/*===================================================== Exports  =====================================================*/

exports.commit = function (scope, user, game, token, message) {
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

/*==================================================== Functions  ====================================================*/

function qSave(game) { return Q.nbind(game.save, game)(); } // TODO move attach q-methods within modelBase

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

function broadcastUpdate(entry, game) {
  socket.broadcastCommonPermitted("news:update.game", entry);
  return game;
}

function aba(scope, entry, game) {
  var defer = Q.defer();
  userC.findById(scope, entry.victim, function (err, v) {
    if (err == null) {
      entry.victim = v != null ? _.pick(v._doc, ["_id", "username"]) : null;
      defer.resolve(broadcastUpdate(entry, game));
    } else {
      defer.reject(err);
    }
  });
  return defer.promise;
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
