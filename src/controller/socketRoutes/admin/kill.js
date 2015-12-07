"use strict";

var Q = require("q");
var gameC = require.main.require("./core/game/controller/game");
var userC = require.main.require("./core/user/controller/user");

module.exports = function (queryRoute) {
  queryRoute("kill:admin.token", function (data) {
    var scope = this;
    return Q
        .all([userC.qFindById(scope, data.murderer), gameC.qFindById(scope, data.game)])
        .then(function (result) {
          return gameC.killByToken(scope, result[0]._doc, result[1], data.token, "Triggered by " + scope.user.username);
        });
  });

  queryRoute("kill:admin.suicide", function (data) {
    var scope = this;
    return Q
        .all([userC.qFindById(scope, data.victim), gameC.qFindById(scope, data.game)])
        .then(function (result) {
          return gameC.killSelf(scope, result[0]._doc, result[1], "Triggered by " + scope.user.username);
        });
  });
};
