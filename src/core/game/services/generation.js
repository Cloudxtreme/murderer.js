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
    return ringC
        .qRemove(scope, {_id: {$in: ringIds}})
        .then(function (data) {
          ringIds.splice(0, ringIds.length);
          return data;
        });
  }
  return Q.resolve();
}

function removeFromSet(set, item) {
  for (var j = 0; j < set.length; j++) {
    if (set[j] === item) {
      set.splice(j, 1);
      break;
    }
  }
}

function checkUserObligatory(chain, rings, lives, user) {
  if (lives[user] == rings) {
    chain.push(user);
    lives[user]--;
  }
}

/**
 * TODO test this xD
 * Generates (does not attach to game) rings as defined within game startMeta with users defined within game.
 *
 * The generation process:
 *   1. Iterate over rings.
 *     a) Pick users that need to be present within all remaining rings.
 *     b) Add random users that have lives remaining and ain't picked already until cap-size is reached.
 *     c) Shuffle.
 *     d) Create Ring instance (async, return promise).
 *   2. Once all promises are resolved, return IDs.
 *
 * @param scope The scope object.
 * @param game The game object.
 * @returns {[ObjectID]} IDs of rings that got generated.
 */
function generateRings(scope, game) {
  var log = scope.log.child({game: game, startMeta: game.startMeta});
  var rings = game.startMeta.rings, lives = game.startMeta.lives;
  var track = {tokens: [], users: {}};
  var users, livesLeftTotal;

  if (rings <= 0) { return Q.resolve([]); }
  if (rings < lives) { lives = rings; }

  users = _.flatten(_.pluck(game.groups, ["users", "user"]));
  if (users.length < 2) { return Q.reject("To few users."); }
  livesLeftTotal = users.length * lives;
  _.each(users, function (user) { track.users[user] = lives; });

  log.debug({amount: rings, lives: lives}, "generating rings");

  return Q.all(_.times(rings, function (j) {
    var ringsLeft = rings - j;
    var chain = [];
    var candidate;
    var capSize = Math.ceil(livesLeftTotal / ringsLeft);
    // add users to chain that must be added into all remaining rings
    _.each(users, _.partial(checkUserObligatory, chain, ringsLeft, track.users));
    var additions = capSize - chain.length;
    if (additions > 0) {
      // add random users that have lives left until cap-size is reached
      var chainAddition = _.sample(_.without.apply(_, users, chain), additions);
      for (var i = 0; i < chainAddition.length; i++) {
        candidate = chainAddition[i];
        // remove user from users list if no lives left
        if (!--track.users[candidate]) { removeFromSet(users, candidate); }
      }
      chain = chain.concat(chainAddition);
    }
    livesLeftTotal -= chain.length;
    return ringC
        .qCreate({
          active: chain.length,
          chain: _.map(_.shuffle(chain), _.partial(getChainEntry, track.tokens))
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
