"use strict";

var _ = require("lodash");
var Q = require("q");

var controller = require("../controller");
var ringC = require.main.require("./core/ring/controller");

/*================================================ State Definitions  ================================================*/

/*
 * Valid combination of state flags
 *   a) !started && !active && !ended   <=>   no statistics, no kills, no suicides
 *   b)  started && !active && !ended   <=>                  no kills,              no (de)registrations
 *   c)  started &&  active && !ended   <=>                                         no (de)registrations
 *   d)  started && !active &&  ended   <=>                  no kills, no suicides, no (de)registrations
 *
 * State transitions (0 = delete game)
 *   a -> [b,c,0] (lock, start, remove)
 *   b -> [c,d]   (resume, stop)
 *   c -> [b,d]   (pause, stop)
 *   d -> [0]     (remove)
 */

/*===================================================== Exports  =====================================================*/

exports.lock = function (scope, gameId) { return start(scope, gameId, false); };
exports.start = function (scope, gameId) { return start(scope, gameId, true); };
exports.resume = resume;
exports.pause = pause;
exports.stop = stop;
exports.remove = remove;

/*==================================================== Functions  ====================================================*/

function errorIfNull(game) {
  if (game == null) { return Q.reject("Game not found or transition not allowed."); }
  return game;
}

function start(scope, gameId, activate) {
  return controller
      .qFindOne(scope,
          {_id: gameId, started: false},
          {rings: 1, groups: 1, "startMeta.rings": 1, "startMeta.lives": 1})
      .then(errorIfNull)
      .then(function (game) {
        scope.log.debug({game: game, startMeta: game.startMeta}, "starting game");
        return purgeRings(scope, game.rings)
            .then(function () {
              var rings = game.startMeta.rings, lives = game.startMeta.lives;
              if (rings <= 0) { return Q.resolve([]); }
              if (rings < lives) { lives = rings; }
              var users = _(game.groups).pluck("users").flatten().pluck("user").value();
              var childScope = _.extend({}, scope, {log: scope.log.child({game: game, startMeta: game.startMeta})});
              return ringC.qGenerate(childScope, game._id, users, rings, lives);
            })
            .then(function (ringIds) {
              return controller.qFindByIdAndUpdate(scope,
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

function resume(scope, gameId) {
  return controller
      .qFindOneAndUpdate(scope,
          {_id: gameId, started: true, active: false, ended: false},
          {active: true},
          {new: true})
      .then(errorIfNull);
}

function pause(scope, gameId) {
  return controller
      .qFindOneAndUpdate(scope,
          {_id: gameId, active: true, ended: false},
          {active: false},
          {new: true})
      .then(errorIfNull);
}

function stop(scope, gameId) {
  return controller
      .qFindOneAndUpdate(scope,
          {_id: gameId, started: true, ended: false},
          {active: false, ended: true},
          {new: true})
      .then(errorIfNull);
}

function remove(scope, gameId) {
  return controller
      .qFindOneAndRemove(scope, {_id: gameId, $or: [{started: true, ended: true}, {started: false}]})
      .then(errorIfNull)
      .then(function (game) { return purgeRings(scope, game.rings); });
}
