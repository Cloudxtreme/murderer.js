"use strict";

var Q = require("q");
var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var murder = require("./services/murder");
var contract = require("./services/contract");
var generation = require("./services/generation");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

// get
exports.qPopulated = findByIdPopulated;
exports.qFindContracts = contract.all;
// update
exports.qGenerateRings = generateRings;
exports.qKillByToken = murder.byKill;
exports.qSuicide = murder.bySuicide;

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

function generateRings(scope, id, amount) {
  return exports
      .qFindById(scope, id, {rings: 1})
      .then(function (game) {
        if (game == null) { throw new Error("Game not found."); }
        scope.log.debug({game: game, amount: amount}, "generating game rings");
        return generation
            .purgeRings(scope, game.rings)
            .then(function () { return generation.generateRings(scope, game, amount); })
            .then(function (ringIds) { return exports.qUpdateById(scope, game._id, {rings: ringIds}); });
      });
}
