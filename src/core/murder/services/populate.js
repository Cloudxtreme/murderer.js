"use strict";

var _ = require("lodash");
var Q = require("q");
var userC = require.main.require("./core/user/controller");
var gameC = require.main.require("./core/game/controller");

var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.newsInstance = populateSingle;

/*==================================================== Functions  ====================================================*/

function populateSingle(scope, murder, murderer, victim, game) {
  var promise;
  if (typeof murder === "string" || !murder.hasOwnProperty("_doc")) {
    promise = controller.qFindById(murder);
  } else {
    promise = Q.when(murder);
  }
  return promise.then(function (murder) {
    return Q
        .spread(
            [
              murderer || murder.murderer && userC.qFindById(murder.murderer),
              victim || userC.qFindById(murder.victim),
              game || gameC.qFindById(murder.game)
            ],
            function (murderer, victim, game) {
              return _.extend(
                  _.omit(murder._doc, ["ring"]),
                  {murderer: murderer, victim: victim, game: _.pick(game._doc, ["_id", "name"])}
              );
            })
        .fail(function (err) { scope.log.error({err: err}, "failed to fetch users participating in murder"); });
  });
}
