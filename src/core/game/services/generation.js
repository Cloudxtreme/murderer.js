"use strict";

var _ = require("lodash");
var Q = require("q");
var ringC = require.main.require("./core/ring/controller");
var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;

/*===================================================== Exports  =====================================================*/

exports.generateRings = function (scope, game, amount) {
  var users = _.flatten(_.pluck(game.groups, "users"));
  if (users.length < 2) { return Q.reject("To few users."); }
  var promise = game.rings.length ? ringC.qRemove(scope, {_id: {$in: game.rings}}) : Q.when();
  return promise.then(function () {
    var rings = game.rings = [];
    var tokens = [];
    return Q.all(_.times(amount, function () {
      return ringC
          .qCreate({
            active: users.length,
            chain: _.map(_.shuffle(users), _.partial(getChainEntry, tokens))
          })
          .then(function (ring) {
            rings.push(ring._id);
            return ring;
          });
    }));
  });
};

/*==================================================== Functions  ====================================================*/

function getChainEntry(tokens, user) {
  var token;
  do {
    token = security.generateToken(config.security.humanToken.bytes).toUpperCase();
  } while (_.contains(tokens, token));
  tokens.push(token);
  return {user: user, token: token};
}
