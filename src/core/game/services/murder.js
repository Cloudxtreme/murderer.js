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

/*--------------------------------------------- relevant for kills only  ---------------------------------------------*/

function kill(scope, userId, gameId, token, message, triggered) {
  return findGameData(scope, gameId, {
    murderer: userId,
    token: token,
    message: message,
    triggered: triggered,
    suicide: false
  })
      .then(findCrimeScene)
      .then(createMurder)
      .then(applyMurderToRing)
      .then(broadcast);
}

function findCrimeScene(data) {
  var rings = data.game.rings;
  data = passFirst(rings, function (ring, ringIdx) {
    if (ring.active < 2) { return; }

    var mItemIdx = _.findLastIndex(ring.chain, isAlive);
    var potentialVictim = ring.chain[mItemIdx].user.equals(data.murderer);
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
          potentialVictim = ring.chain[mItemIdx = idx].user.equals(data.murderer);
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
      .qUpdate(data.scope, data.ring._id, {$set: $set, $inc: {active: -(1 + data.skippedVictims.length)}})
      .then(_.constant(data))
      .fail(function (err) {
        data.scope.log.error({err: err}, "failed to update ring with murder");
        data.scope.log.info("attempt to revert murder");
        return murderC
            .qRemoveById(data.scope, data.murder._id)
            .then(function () { data.scope.log.info("revert successful"); },
                function (err) { data.scope.log.fatal({err: err, data: data}, "revert failed"); })
            .then(_.constant(Q.reject("Internal error.")));
      });
}

/*-------------------------------------------- relevant for suicides only --------------------------------------------*/

function suicide(scope, userId, gameId, message, triggered) {
  return findGameData(scope, gameId, {
    murderer: userId,
    message: message,
    triggered: triggered,
    suicide: true
  })
      .then(findSuicideIndices)
      .then(createMurder)
      .then(applySuicideToRing)
      .then(broadcast);
}

function findSuicideIndices(data) {
  var rings = data.game.rings;
  data.suicides = _.compact(_.map(rings, function (ring, ringIdx) {
    // check whether any other user is still alive and find index of active user
    var anyOther = false, found = false, idx = -1, chain = ring.chain, current;
    for (var i = 0; i < chain.length; i++) {
      current = chain[i];
      if (current.murder == null) {
        if (found) {
          anyOther = true;
          break;
        } else if (current.user.equals(data.murderer)) {
          idx = i;
          found = true;
          if (anyOther) { break; }
        } else {
          anyOther = true;
        }
      }
    }
    if (anyOther && found) { return {ring: ring, index: idx, ringIndex: ringIdx}; }
  }));
  if (!data.suicides.length) { return Q.reject("Not alive in any non-resolved ring."); }
  return data;
}

function applySuicideToRing(data) {
  return Q
      .all(_.map(data.suicides, function (suicide) {
        var $set = {};
        $set["chain." + suicide.index + ".murder"] = data.murder._id;
        return ringC
            .qUpdateById(data.scope, suicide.ring._id, {$set: $set, $inc: {active: -1}})
            .fail(function (err) {
              data.scope.log.fatal({err: err}, "failed to update ring with suicide");
              return Q.reject("Internal error.");
            })
            .then(function () { return getSuicideEmailData(data.game, suicide); });
      }))
      .then(function (emailData) {
        data.scope.log.info("suicide executed");
        notifySuicideHunters(data.scope, data.game, emailData).done();
        return data;
      });
}

function getSuicideEmailData(game, suicide) {
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
  var target = null, user = chain[nextIdx].user;
  _.any(game.groups, function (groupData) {
    return target = _.find(groupData.users, function (userData) { return userData.user.equals(user); }).name;
  });
  if (target == null) {
    throw new Error("Target not identified.");
  }
  // TODO add suicide-message of user into email
  return {
    last: prevIdx === nextIdx,
    addressee: chain[prevIdx].user,
    target: target,
    ringIndex: suicide.ringIndex,
    ring: suicide.ring
  };
}

function notifySuicideHunters(scope, game, emailData) {
  // send grouped emails to each ex-hunter of whom who committed suicide
  var addressee = _.groupBy(emailData, "addressee");
  return Q.all(_.map(addressee, function (emailD, adr) {
    return userC
        .qFindById(scope, adr)
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
  }));
}

function sendSuicideEmail(scope, addressee, game, target, survived) {
  if (!_.keys(target).length) { return; }
  var listing = _.map(target, function (name, idx) {
    return survived ? "#" + idx : "  #" + idx + ": " + name;
  }).join(survived ? ", " : "\n  ");
  return userC.qSendMailByKey(scope, addressee, "game." + (survived ? "survived" : "newMissions"), {
    listing: listing,
    link: config.server.url + "contracts",
    game: game.name
  });
}

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
  if (!data.suicide && !data.game.active) { throw new Error("Game is not active."); }
  return controller
      .qPopulate(data.scope, data.game, "rings")
      .fail(function (err) {
        data.scope.log.error({err: err}, "failed to populate game rings");
        return Q.reject("Internal error.");
      })
      .then(_.constant(data));
}

function createMurder(data) {
  data.scope.log = data.scope.log.child(_.omit(data, ["scope"]));
  data.scope.log.info("valid " + (data.suicide ? "suicide" : "kill"));
  return murderC
      .qCreate(data.scope, {
        message: data.message,
        murderer: data.murderer,
        victim: data.victim,
        ring: data.suicide ? null : data.ring._id,
        game: data.game._id,
        trigger: data.triggered ? data.scope.user._id : null
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
