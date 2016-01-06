"use strict";

var _ = require("lodash");
var Q = require("q");

var ringC = require.main.require("./core/ring/controller");
var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;

/*===================================================== Exports  =====================================================*/

exports.generate = generate;

/*==================================================== Functions  ====================================================*/

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
 * Generates rings as specified via parameters.
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
 * @param {ObjectID} gameId The ID of the game that contains the ring.
 * @param {[User._id]} users The list of users to consider for generated rings.
 * @param {Number} rings The amount of rings to generate.
 * @param {Number} lives The amount of rings for each user to be present in.
 * @param {[String]} tokens Tokens that are already in use and need to be considered for uniqueness tests.
 * @returns {[ObjectID]} IDs of rings that got generated.
 */
function generate(scope, gameId, users, rings, lives, tokens) {
  if (users.length < 2) { return Q.reject("To few users."); }

  tokens = tokens ? _.clone(tokens) : [];
  var livesLeftTotal = users.length * lives;
  var remainingLives = {};
  _.each(users, function (user) { remainingLives[user] = lives; });

  scope.log.debug({amount: rings, lives: lives}, "generating rings");

  return Q.all(_.times(rings, function (j) {
    var ringsLeft = rings - j;
    var chain = [];
    var candidate;
    var capSize = Math.ceil(livesLeftTotal / ringsLeft);
    // add users to chain that must be added into all remaining rings
    _.each(users, _.partial(checkUserObligatory, chain, ringsLeft, remainingLives));
    var additions = capSize - chain.length;
    if (additions > 0) {
      // add random users that have lives left until cap-size is reached
      var chainAddition = _.sample(_.without.apply(_, [users].concat(chain)), additions);
      for (var i = 0; i < chainAddition.length; i++) {
        candidate = chainAddition[i];
        // remove user from users list if no lives left
        if (!--remainingLives[candidate]) { removeFromSet(users, candidate); }
      }
      chain = chain.concat(chainAddition);
    }
    livesLeftTotal -= chain.length;
    return ringC
        .qCreate(scope, {
          game: gameId,
          active: chain.length,
          chain: _.map(_.shuffle(chain), _.partial(getChainEntry, tokens))
        })
        .then(function (ring) {
          scope.log.debug({ring: ring}, "ring created");
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
