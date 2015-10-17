"use strict";

var Q = require("q");
var gameC = require.main.require("./core/game/controller/game");
var security = require.main.require("./utils/security");

var qFindOneGame = Q.denodeify(gameC.findOne);

module.exports = function (queryRoute) {
  queryRoute("kill:token", function (data, cb) {
    var scope = this;
    if (typeof data !== "object" || typeof data.token !== "string" || typeof data.message !== "string") {
      return cb(new Error("Invalid request."));
    }
    qFindOneGame(scope, {active: true})
        .then(function (game) {
          if (game == null) {
            throw new Error("Game not found.");
          }
          return game;
        })
        .then(function (game) { return gameC.killByToken(scope, scope.user, game, data.token, data.message); })
        .done(function () { cb(); }, cb);
  });

  queryRoute("kill:self", function (data, cb) {
    var scope = this;
    if (typeof data !== "object" || typeof data.password !== "string" || typeof data.message !== "string") {
      return cb(new Error("Invalid request."));
    }
    if (!security.checkPassword(data.password, scope.user.hashedPassword)) {
      return cb(new Error("Invalid password."));
    }
    qFindOneGame(scope, {active: true})
        .then(function (game) {
          if (game == null) {
            throw new Error("Game not found.");
          }
          return game;
        })
        .then(function (game) { return gameC.killSelf(scope, scope.user, game, data.message); })
        .done(function () { cb(); }, cb);
  });
};
