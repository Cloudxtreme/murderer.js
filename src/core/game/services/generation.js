"use strict";

var _ = require("lodash");
var Q = require("q");
var ringC = require.main.require("./core/ring/controller");
var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;

/*===================================================== Exports  =====================================================*/

exports.generateRings = generateRings;
exports.purgeRings = purgeRings;

/*==================================================== Functions  ====================================================*/

function purgeRings(scope, ringIds) {
  if (ringIds instanceof Array && ringIds.length > 0) {
    scope.log.debug({rings: ringIds}, "purging rings");
    return ringC.qRemove(scope, {_id: {$in: ringIds}});
  }
  return Q.resolve();
}

function generateRings(scope, game, amount) {
  var log = scope.log.child({game: game, amount: amount});
  log.debug("generating rings");
  var users = _.flatten(_.pluck(game.groups, "users"));
  if (users.length < 2) { return Q.reject("To few users."); }
  var tokens = [];
  return Q.all(_.times(amount, function () {
    return ringC
        .qCreate({
          active: users.length,
          chain: _.map(_.shuffle(users), _.partial(getChainEntry, tokens))
        })
        .then(function (ring) {
          log.debug({ring: ring}, "ring created");
          return ring._id;
        });
  }));
}

function getChainEntry(tokens, user) {
  var token;
  do {
    token = security.generateToken(config.security.humanToken.bytes).toUpperCase();
  } while (_.contains(tokens, token));
  tokens.push(token);
  return {user: user, token: token};
}
