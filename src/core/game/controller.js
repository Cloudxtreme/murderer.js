"use strict";

var Q = require("q");
var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var kill = require("./services/kill");
var suicide = require("./services/suicide");
var generation = require("./services/generation");

var POPULATE_DETAILS = [];

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

// get
exports.qPopulated = findByIdPopulated;
// update
exports.qGenerateRings = generateRings;
exports.qKillByToken = kill.commit;
exports.qSuicide = suicide.commit;

/*==================================================== Functions  ====================================================*/

function qSave(game) { return Q.nbind(game.save, game)(); } // TODO attach q-methods within modelBase

/**
 * Returns Promise for populated game model with specified ID.
 * @param scope The scope object.
 * @param id The ID of the game to fetch
 */
function findByIdPopulated(scope, id) {
  scope.log.debug({gameId: id}, "fetching populated game instance");
  var query = model.findById(id).populate(POPULATE_DETAILS);
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
