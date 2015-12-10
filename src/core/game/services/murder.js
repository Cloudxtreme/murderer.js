"use strict";

var _ = require("lodash");
var Q = require("q");
var userC = require.main.require("./core/user/controller");
var ringC = require.main.require("./core/ring/controller");
var murderC = require.main.require("./core/murder/controller");
var config = require.main.require("./utils/config").main;

var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.byKill = kill;
exports.bySuicide = suicide;

// TODO test all functions

/*==================================================== Functions  ====================================================*/

/*------------------------------------------- shared by kills and suicides -------------------------------------------*/

function findGameData(scope, gameId, data) {
  return controller
      .qFindById(scope, gameId)
      .then(function (game) {
        return _.extend(data, {
          game: game,
          scope: _.extend({}, scope, {log: scope.log.child(data)})
        });
      })
      .then(populateRings);
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

function createMurder(data) {
  data.scope.log = data.scope.log.child(data);
  data.scope.log.info("valid " + (data.suicide ? "suicide" : "kill"));
  return murderC
      .qCreate({
        message: data.message,
        murderer: data.murderer,
        victim: data.victim,
        ring: data.suicide ? null : data.ring._id,
        game: data.game._id
      })
      .then(function (murder) {
        data.scope.log = data.scope.log.child({murder: data.murder});
        return _.extend(data, {murder: murder});
      })
      .fail(function (err) {
        data.scope.log.error({err: err}, "failed to create murder entry");
        return Q.reject("Internal error.");
      });
}

function broadcast(data) {
  murderC.qNewsBroadcast(data.scope, data.murder, null, null, data.game).done();
  return data;
}

/*--------------------------------------------- relevant for kills only  ---------------------------------------------*/

function kill(scope, userId, gameId, token, message) {
  return findGameData(scope, gameId, {murderer: userId, token: token, message: message, suicide: false})
      .then(findCrimeScene)
      .then(createMurder)
      .then(applyMurderToRing)
      .then(broadcast);
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

function isAlive(chainItem) { return chainItem.murder == null; }

function passFirst(array, fn) {
  var result;
  for (var i = 0; i < array.length; i++) {
    result = fn(array, i);
    if (result != null) { return result === false ? null : result; }
  }
  return null;
}

function applyMurderToRing(data) {
  var $set = {};
  _.each(data.skippedVictims, function (i) { $set["chain." + i + ".vulnerable"] = false; });
  $set["chain." + data.index + ".vulnerable"] = false;
  $set["chain." + data.index + ".murder"] = data.murder._id;
  return ringC
      .qUpdate(data.ring._id, {$set: $set, $inc: {active: -(1 + data.skippedVictims.length)}})
      .then(_.constant(data))
      .fail(function (err) {
        data.scope.log.error({err: err}, "failed to update ring with murder");
        data.scope.log.info("attempt to revert murder");
        return murderC
            .qRemoveById(data.murder._id)
            .then(function () { data.scope.log.info("revert successful"); },
                function (err) { data.scope.log.fatal({err: err, data: data}, "revert failed"); })
            .then(_.constant(Q.reject("Internal error.")));
      });
}

/*-------------------------------------------- relevant for suicides only --------------------------------------------*/

function suicide(scope, userId, gameId, message) {
  return findGameData(scope, gameId, {murderer: userId, message: message, suicide: true})
      .then(findSuicideIndices)
      .then(createMurder)
      .then(applySuicideToRing)
      .then(broadcast);
}

function findSuicideIndices(data) {
  var rings = data.game.rings;
  data.suicides = _.compact(_.map(rings, function (ring) {
    var idx = _.findIndex(ring.chain, function (item) { return item.user === data.murderer && item.murder == null; });
    if (~idx) { return {ring: ring, index: idx}; }
  }));
  if (!data.suicides.length) { return Q.reject("Not alive."); }
  return data;
}

function applySuicideToRing(data) {
  return Q
      .all(_.map(data.suicides, function (suicide) {
        var $set = {};
        $set["chain." + suicide.index + ".murder"] = data.murder._id;
        return ringC
            .qUpdate(suicide.ring._id, {$set: $set, $inc: {active: -1}})
            .fail(function (err) {
              data.scope.log.fatal({err: err}, "failed to update ring with suicide");
              return Q.reject("Internal error.");
            })
            .then(function () { return getSuicideEmailData(suicide); });
      }))
      .then(function (emailData) {
        notifySuicideHunters(data.scope, data.game, emailData).done();
        return data;
      });
}

function getSuicideEmailData(suicide) {
  var chain = suicide.ring.chain, prevIdx = suicide.index, nextIdx = suicide.index;
  var last = chain.length - 1;
  do {
    prevIdx--;
    if (prevIdx < 0) { prevIdx = last; }
  } while (prevIdx !== suicide.index && chain[prevIdx].murder != null);
  if (prevIdx === suicide.index) { return; } // last remaining user in ring => no notification needed
  do {
    nextIdx++;
    if (nextIdx > last) { nextIdx = 0; }
  } while (nextIdx !== prevIdx && chain[nextIdx].murder != null);
  return {
    last: prevIdx === nextIdx,
    addressee: chain[prevIdx],
    target: chain[nextIdx],
    ringIndex: suicide.index,
    ring: suicide.ring
  };
}

function notifySuicideHunters(scope, game, emailData) {
  // send grouped emails to each ex-hunter of whom who committed suicide
  var addressee = _.groupBy(emailData, "addressee");
  return _.map(addressee, function (emailD, adr) {
    return userC
        .qFindById(adr)
        .then(function (user) {
          var survived = {}, nextTarget = {};
          _.each(emailD, function (eD) { (eD.last ? survived : nextTarget)[eD.ringIndex] = eD.target; });
          return Q
              .all([
                sendSuicideEmail(scope, user, game, survived, true),
                sendSuicideEmail(scope, user, game, nextTarget, false)
              ])
              .fail(function (err) {
                scope.log.warn({err: err, addressee: user}, "failed to notify hunter");
              });
        });
  });
}

function sendSuicideEmail(scope, addressee, game, target, survived) {
  if (!_.keys(target).length) { return; }
  return Q
      .all(_.map(target, function (target, key) {
        return userC.qFindById(target).then(function (t) { target[key] = t.username; });
      }))
      .then(function () {
        var listing = _.map(target, function (targetName, idx) {
          return survived ? "#" + idx : "  #" + idx + ": " + targetName;
        }).join(survived ? ", " : "\n  ");
        return userC.qSendMailByKey(scope, addressee, "game." + (survived ? "survived" : "newMissions"), {
          listing: listing,
          link: config.server.url + "contracts",
          game: game.name
        });
      });
}
