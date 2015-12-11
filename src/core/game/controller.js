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

function qSave(game) { return Q.nbind(game.save, game)(); } // TODO attach q-methods within modelBase

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
      .qFindById(scope, id)
      .then(function (game) {
        scope.log.debug({game: game, amount: amount}, "generating game rings");
        return generation
            .generateRings(scope, game, amount)
            .then(function () {
              scope.log.debug({game: game, rings: game.rings}, "generated game rings");
              return game;
            });
      })
      .then(function (game) { return qSave(game); });
}
