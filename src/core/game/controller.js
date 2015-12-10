"use strict";

var Q = require("q");
var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var kills = require("./services/kills");
var suicides = require("./services/suicides");
var generation = require("./services/generation");

var POPULATE_DETAILS = [];

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

// get
exports.qPopulated = findByIdPopulated;
// update
exports.qGenerateRings = generateRings;
exports.qKillByToken = kills.commit;
exports.qKillSelf = suicides.commit;

/*==================================================== Functions  ====================================================*/

function qSave(game) { return Q.nbind(game.save, game)(); } // TODO move attach q-methods within modelBase

/**
 * Returns Promise for populated game model with specified ID.
 * @param scope The scope object.
 * @param id The ID of the game to fetch
 */
function findByIdPopulated(scope, id) {
  scope.log.debug({gameId: id}, "fetching populated game instance");
  return Q.nfcall(model.findById(id).populate(POPULATE_DETAILS).exec);
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
