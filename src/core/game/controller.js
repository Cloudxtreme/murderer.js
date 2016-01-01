"use strict";

var _ = require("lodash");
var Q = require("q");
var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var ringC = require.main.require("./core/ring/controller");

var murder = require("./services/murder");
var contract = require("./services/contract");
var generation = require("./services/generation");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

// get
exports.qPopulated = findByIdPopulated; // TODO use, rework
exports.qFindContracts = contract.all;
// update
exports.qAddRings = addRingsToGame; // TODO use
exports.qKillByToken = murder.byKill;
exports.qSuicide = murder.bySuicide;
exports.qStart = startGame;
exports.qFindWithAccess = findWithAccess;
exports.qFindJoined = findJoined;
exports.qJoin = join;
exports.qLeave = leave;

/*==================================================== Functions  ====================================================*/

// TODO move most functions into services

/**
 * Returns Promise for populated game instance by specified ID.
 * @param scope The scope object.
 * @param gameId The ID of the game to fetch.
 * @param [population] The population options (most likely array of paths).
 * @returns Q Promise of populated game instance.
 */
function findByIdPopulated(scope, gameId, population) {
  if (population == null) { population = ["rings"]; }
  scope.log.debug({gameId: gameId, population: population}, "fetching populated game instance");
  var query = model.findById(gameId).populate("rings");
  return Q.nbind(query.exec, query)();
}

function pluckId(r) { return r._id; }

function valueOfFulfillment(result) { return result.state === "fulfilled" ? result.value : null; }

function addRingsToGame(scope, gameId, rings) {
  return exports
      .qFindById(scope, gameId, {rings: 1, groups: 1})
      .then(function (game) {
        if (game == null) { return Q.reject("Game not found."); }
        return Q
            .allSettled(_.map(rings, function (ring) {
              scope.log.debug({game: game, ring: ring}, "generating additional game ring");
              if (ring.hasOwnProperty("_id")) {
                if (!ring._id || _.contains(game.rings, ring._id)) { return Q.reject("Game already holds this ring."); }
                return ring._id;
              }
              return ringC.qCreate(scope, ring).then(pluckId);
            }))
            .then(function (results) {
              var ringIds = _.compact(_.map(results, valueOfFulfillment));
              scope.log.debug({game: game, rings: ringIds}, "attaching generated rings to game");
              return exports.qUpdateById(scope, game._id, {$push: {rings: {$each: ringIds}}});
            });
      });
}

function startGame(scope, gameId, activate) {
  return exports
      .qFindById(scope, gameId, {rings: 1, groups: 1, "startMeta.rings": 1, "startMeta.lives": 1})
      .then(function (game) {
        if (game == null) { throw new Error("Game not found."); }
        scope.log.debug({game: game, startMeta: game.startMeta}, "starting game");
        return generation
            .purgeRings(scope, game.rings)
            .then(function () { return generation.generateRings(scope, game); })
            .then(function (ringIds) {
              return exports.qFindByIdAndUpdate(scope,
                  game._id,
                  {rings: ringIds, started: true, active: activate || false},
                  {new: true});
            });
      })
      .then(function (game) {
        scope.log.info({game: game}, "game started");
        return game;
      });
}

function findWithAccess() {
  var query = model
      .find(null, {
        "groups.users.message": 0,
        "groups.users.name": 0,
        description: 0,
        "schedule.start": 0,
        "schedule.activate": 0,
        "schedule.deactivate": 0,
        log: 0
      })
      .populate("author", {username: 1, avatarUrl: 1});
  return Q
      .nbind(query.exec, query)()
      .then(function (games) {
        return _.map(games, function (game) {
          return _.extend(game._doc, {
            passwords: !!(game.passwords && game.passwords.length),
            rings: game.started ? game.rings.length : game.startMeta.rings
          });
        });
      });
}

function findJoined(scope) {
  return exports
      .qFind(scope, {"groups.users.user": scope.user._id}, {_id: 1})
      .then(function (games) { return _.pluck(games, "_id"); });
}

function getJoinErrorOrGroupIndex(groups, groupId, userId, name) {
  var err = null, groupIdx = null;
  var groupCheck = function (group, i) {
    if (group.group.toString() === groupId) { groupIdx = i; }
    return _.any(group.users, function (u) {
      return err = u.user === userId ? "Already joined." : u.name === name ? "Name already in use." : null;
    });
  };
  if (_.any(groups, groupCheck)) { return Q.reject(err); }
  if (groupIdx == null) { return Q.reject("Group not found."); }
  return groupIdx;
}

function join(scope, gameId, name, message, groupId) {
  var userId = scope.user._id;
  return exports
      .qFindById(scope, gameId)
      .then(function (game) {
        if (game.started) { return Q.reject("Game already locked."); }
        return getJoinErrorOrGroupIndex(game.groups, groupId, userId, name);
      })
      .then(function (groupIdx) {
        var push = {};
        push["groups." + groupIdx + ".users"] = {user: userId, name: name, message: message};
        scope.log.info({gameId: gameId, name: name, groupIdx: groupIdx}, "user joins game");
        return exports.qFindByIdAndUpdate(scope, gameId, {$push: push}, {new: true});
      })
      .then(groupsDataOnly);
}

function groupsDataOnly(game) {
  return {
    groups: _.map(game.groups, function (group) { return {group: group.group, users: _.pluck(group.users, "user")}; })
  };
}

function leave(scope, gameId) {
  var userId = scope.user._id;
  return exports
      .qFindOneAndUpdate(scope,
          {_id: gameId, started: false, "groups.users.user": userId},
          {$pull: {"groups.$.users": {user: userId}}},
          {new: true})
      .then(function (game) {
        scope.log.info({game: game}, "user left game");
        return game;
      })
      .then(groupsDataOnly);
}
