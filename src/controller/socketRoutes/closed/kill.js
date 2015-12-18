"use strict";

var Q = require("q");
var gameC = require.main.require("./core/game/controller");
var security = require.main.require("./utils/security");

module.exports = function (queryRoute) {
  queryRoute("kill:token", function (data) {
    var scope = this;
    if (typeof data !== "object" || typeof data.token !== "string" || typeof data.message !== "string") {
      return Q.reject(new Error("Invalid request."));
    }
    return gameC.qFindOne(scope, {active: true})
        .then(function (game) {
          if (game == null) {
            throw new Error("Game not found.");
          }
          return game;
        })
        .then(function (game) { return gameC.qKillByToken(scope, scope.user, game, data.token, data.message); });
  });

  queryRoute("kill:self", function (data) {
    var scope = this;
    if (typeof data !== "object" || typeof data.password !== "string" || typeof data.message !== "string") {
      return Q.reject(new Error("Invalid request."));
    }
    if (!security.checkPassword(data.password, scope.user.pw)) {
      return Q.reject(new Error("Invalid password."));
    }
    return gameC.qFindOne(scope, {active: true})
        .then(function (game) {
          if (game == null) {
            throw new Error("Game not found.");
          }
          return game;
        })
        .then(function (game) { return gameC.qSuicide(scope, scope.user, game, data.message); });
  });
};
