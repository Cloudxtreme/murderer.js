"use strict";

var _ = require("lodash");
var Q = require("q");
var socket = require.main.require("./controller/socket");
var userC = require.main.require("./core/user/controller");
var ringC = require.main.require("./core/ring/controller");
var murderC = require.main.require("./core/murder/controller");

var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.commit = kill;

/*==================================================== Functions  ====================================================*/

// TODO test all functions

function kill(scope, userId, gameId, token, message) {
  return controller
      .qFindById(scope, gameId)
      .then(function (game) {
        var data = {murderer: userId, game: game, token: token, message: message};
        return _.extend(data, {scope: _.extend({}, scope, {log: scope.log.child(data)})});
      })
      .then(populateRings)
      .then(findCrimeScene)
      .then(createMurder)
      .then(applyMurderToRing)
      .then(broadcast);
}

function isAlive(chainItem) { return chainItem.murder == null; }

function passFirst(array, fn) {
  var result;
  for (var i = 0; i < array.length; i++) {
    result = fn(array, i);
    if (result != null) { return result === false ? null : result; }
  }
  return null;
}

function populateRings(data) {
  if (!data.game.active) { throw new Error("Game is not active."); }
  return controller
      .qPopulate(data.game, "rings")
      .fail(function (err) {
        data.scope.log.error({err: err}, "failed to populate game rings");
        return Q.reject("Internal error.");
      })
      .then(_.constant(data));
}

function findCrimeScene(data) {
  var rings = data.game.rings;
  data = passFirst(rings, function (ring, ringIdx) {
    if (ring.active < 2) { return; }

    var mItemIdx = _.findLastIndex(ring.chain, isAlive), potentialVictim = ring.chain[mItemIdx].user === data.murderer;
    var skippedVictims = [];
    return passFirst(ring.chain, function (item, idx) {
      if (item.vulnerable) {
        if (potentialVictim) {
          if (data.token === item.token) { // victim found and verified
            return _.extend(data, {
              ring: ring,
              ringIndex: ringIdx,
              index: idx,
              victim: item.user,
              skippedVictims: skippedVictims
            });
          } else if (isAlive(item)) { // stop looking for any other victim in this ring
            return false;
          }
          skippedVictims.push(idx);
        } else if (isAlive(item)) { // item is next potential murderer
          potentialVictim = ring.chain[mItemIdx = idx].user === data.murderer;
        }
      }
    });
  });
  return data || Q.reject("Token invalid.");
}

function createMurder(data) {
  data.scope.log = data.scope.log.child(data);
  data.scope.log.info("valid kill");
  return murderC
      .qCreate({
        message: data.message,
        murderer: data.murderer,
        victim: data.victim,
        ring: data.ring._id,
        game: data.game._id
      })
      .then(function (murder) { return _.extend(data, {murder: murder}); })
      .fail(function (err) {
        data.scope.log.error({err: err}, "failed to create murder entry");
        return Q.reject("Internal error.");
      });
}

function applyMurderToRing(data) {
  data.scope.log = data.scope.log.child({murder: data.murder});
  var $set = {};
  _.each(data.skippedVictims, function (i) { $set["chain." + i + ".vulnerable"] = false; });
  $set["chain." + data.index + ".vulnerable"] = false;
  $set["chain." + data.index + ".murder"] = data.murder._id;
  return ringC
      .qUpdate(data.ring._id, {
        $set: $set,
        $inc: {active: -data.skippedVictims.length - 1}
      })
      .then(_.constant(data))
      .fail(function (err) {
        data.scope.log.error({err: err}, "failed to update ring with murder");
        data.scope.log.info("attempt to revert murder");
        return murderC
            .qRemoveById(data.murder._id)
            .then(function () { data.scope.log.info("revert successful"); },
                function (err) { data.scope.log.fatal({err: err, data: data}, "revert failed"); })
            .then(_.constant(Q.reject("Token invalid")));
      });
}

function broadcast(data) {
  Q
      .spread([userC.qFindById(data.murderer), userC.qFindById(data.victim)],
          function (murderer, victim) {
            socket.broadcastCommonPermitted("game:kill.committed", _.extend(_.omit(data.murder._doc, ["ring"]), {
              murderer: murderer,
              victim: victim,
              game: _.pick(data.game._doc, ["_id", "name"])
            }));
          }, function (err) { data.scope.log.error({err: err}, ""); })
      .done();
  return data;
}
