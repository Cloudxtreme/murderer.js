"use strict";

var _ = require("lodash");
var Q = require("q");

var model = require("../model");

/*===================================================== Exports  =====================================================*/

exports.activeContracts = findActiveContracts;

/*==================================================== Functions  ====================================================*/

function findActiveContracts(scope) {
  var userId = scope.user._id;
  var query = model
      .find({started: true, ended: false, "groups.users.user": userId}, {name: 1, active: 1, groups: 1, rings: 1})
      .populate("rings groups.group");
  return Q
      .nbind(query.exec, query)()
      .then(function (games) {
        return _.map(games, function (game) {
          var alias = null, searchAlias = true;
          var usersMap = {};
          // create map of users to easily find target user data later on and determine alias data
          _.each(game.groups, function (groupData) {
            _.each(groupData.users, function (userData) {
              usersMap[userData.user] = userData._doc;
              if (searchAlias && userData.user.equals(userId)) {
                alias = getUserData(usersMap, userData);
                alias.group = groupData.group;
                delete alias.message;
                searchAlias = false;
              }
            });
          });
          if (searchAlias) { throw new Error("User not found."); }
          return {
            _id: game._id,
            name: game.name,
            multiGroup: game.groups.length > 1,
            alias: alias,
            active: game.active,
            contracts: _.map(game.rings, _.partial(getContractDataOfRing, userId, usersMap))
          };
        });
      });
}

/**
 * Determines the status of given user within given ring.
 *
 * Possible resolutions:
 *   * User is alive and has a contract. (result.target != null && result.token != null)
 *   * User is alive and sole survivor. (result.survived)
 *   * User is not alive and ring is resolved with survivor. (result.resolved && result.survivor != null)
 *   * User is not alive and ring is resolved without survivor. (result.resolved && result.survivor == null)
 *   * User is not alive and ring is not resolved. (!result.resolved)
 *
 * @param {ObjectID} userId The ID of the user to get contract data of.
 * @param {Object} usersMap Maps User._id to the user-data defined within Game.groups[].users[].
 * @param {Object} ring The Ring instance.
 * @returns {{ringId: ObjectID}} The result may also contain the following properties:
 *            * present - true iff the user is present within the ring.
 *            * dead - true iff the user is dead within the ring.
 *            * token - String iff the user might get killed within the ring.
 *            * survived - true iff the user is the last survivor within the ring.
 *            * target - Object iff the user has an active contract within the ring.
 *            * resolved - true iff the user is not alive and the ring got resolved.
 *            * survivor - Object iff the user is not alive and the ring got resolved.
 */
function getContractDataOfRing(userId, usersMap, ring) {
  var result = {ringId: ring._id};
  var chain = ring.chain, aliveChain = [], current, idx, nextAliveIdx;
  for (var i = 0, j = 0; i < chain.length; i++) {
    current = chain[i];
    if (current.murder == null) {
      aliveChain.push(current);
      j++;
    }
    if (current.user.equals(userId)) {
      result.present = true;
      result.dead = current.murder != null;
      if (!result.dead) {
        result.token = current.token;
        nextAliveIdx = j;
      }
      idx = i;
    }
  }
  if (result.present && !result.dead) {
    if (aliveChain.length === 1) {
      result.survived = true;
      delete result.token;
    } else {
      var nextAliveEntry = nextAliveIdx === aliveChain.length ? aliveChain[0] : aliveChain[nextAliveIdx];
      result.target = getUserData(usersMap, nextAliveEntry);
    }
  } else if (aliveChain.length <= 1) {
    result.resolved = true;
    result.survivor = aliveChain.length ? getUserData(usersMap, aliveChain[0]) : null;
  }
  return result;
}

function getUserData(usersMap, chainEntry) {
  var userData = _.clone(usersMap[chainEntry.user]);
  userData._id = userData.user;
  delete userData.user;
  return userData;
}
