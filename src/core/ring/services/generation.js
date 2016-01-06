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

  /* FIXME in one ring a user got listed two times, not sure if game was generated with latest code. review
   * Game:
   * { "_id" : ObjectId("5686e07f85fa707f56150576"), "name" : "#2", "author" : ObjectId("56734e484031d23a5ff6f92f"), "log" : { "activate" : [ ], "deactivate" : [ ] }, "schedule" : { "end" : ISODate("2016-01-29T23:00:00Z"), "start" : null, "deactivate" : [ ], "activate" : [ ] }, "limit" : { "participants" : null, "invitedParticipants" : null }, "startMeta" : { "rings" : 10, "lives" : 8 }, "description" : null, "rings" : [ ObjectId("56871642e2716565108ee97a"), ObjectId("56871642e2716565108ee97f"), ObjectId("56871642e2716565108ee984"), ObjectId("56871642e2716565108ee988"), ObjectId("56871642e2716565108ee98c"), ObjectId("56871642e2716565108ee990"), ObjectId("56871642e2716565108ee994"), ObjectId("56871642e2716565108ee998"), ObjectId("56871642e2716565108ee99c"), ObjectId("56871642e2716565108ee9a0") ], "groups" : [ { "group" : ObjectId("5677f36ff227ed78129d1066"), "_id" : ObjectId("5686e07f85fa707f56150577"), "users" : [ { "message" : "Catch me!", "name" : "root", "user" : ObjectId("56734e484031d23a5ff6f92f"), "_id" : ObjectId("5686e3db85fa707f56150580") }, { "message" : "Go on.", "name" : "ole", "user" : ObjectId("5673fdaa396fb43b5b249157"), "_id" : ObjectId("5686e40985fa707f56150584") }, { "message" : "fdg", "name" : "frissdiegurke", "user" : ObjectId("5673fe35021610225cfd6c64"), "_id" : ObjectId("5686e43585fa707f56150587") }, { "message" : "f", "name" : "fdg", "user" : ObjectId("56734ea74031d23a5ff6f930"), "_id" : ObjectId("5686e45b85fa707f5615058a") } ] } ], "inviteOnly" : false, "passwords" : null, "ended" : false, "active" : true, "started" : true, "cdate" : ISODate("2016-01-01T20:24:31.987Z"), "__v" : 0 }
   * Ring:
   * { "_id" : ObjectId("56871642e2716565108ee998"), "active" : 2, "chain" : [ { "user" : ObjectId("5673fdaa396fb43b5b249157"), "token" : "6AAE6CB9", "_id" : ObjectId("56871642e2716565108ee99b"), "vulnerable" : true, "murder" : ObjectId("568cb8bd882e2ca634c8e528") }, { "user" : ObjectId("56734ea74031d23a5ff6f930"), "token" : "79F85478", "_id" : ObjectId("56871642e2716565108ee99a"), "vulnerable" : true }, { "user" : ObjectId("5673fdaa396fb43b5b249157"), "token" : "EFD558A8", "_id" : ObjectId("56871642e2716565108ee999"), "vulnerable" : true } ], "cdate" : ISODate("2016-01-02T00:13:54.945Z"), "__v" : 0 }
   */
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
      var chainAddition = _.sample(_.without.call(_, users, chain), additions);
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
