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

/*==================================================== Functions  ====================================================*/

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
  var query = model.findById(gameId).populate(["rings"]);
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
              return exports.qUpdateById(scope, game._id, {rings: ringIds, started: true, active: activate || false});
            });
      })
      .then(function (game) {
        scope.log.info({game: game}, "game started");
        return game;
      });
}
