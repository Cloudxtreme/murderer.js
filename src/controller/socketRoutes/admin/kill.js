"use strict";

var Q = require("q");
var gameC = require.main.require("./core/game/controller/game");
var userC = require.main.require("./core/user/controller/user");

var qFindGameById = Q.denodeify(gameC.findById);
var qFindUserById = Q.denodeify(userC.findById);

module.exports = function (queryRoute) {
  queryRoute("kill:admin.token", function (data, cb) {
    var scope = this;
    Q
        .all([
          qFindUserById(scope, data.murderer),
          qFindGameById(scope, data.game)
        ])
        .then(function (result) {
          return gameC.killByToken(scope, result[0], result[1], data.token, "Triggered by " + scope.user.username);
        })
        .done(function () { cb(); }, cb);
  });

  queryRoute("kill:admin.suicide", function (data, cb) {
    console.log(data);
    var scope = this;
    Q
        .all([
          qFindUserById(scope, data.victim),
          qFindGameById(scope, data.game)
        ])
        .then(function (result) {
          return gameC.killSelf(scope, result[0], result[1], "Triggered by " + scope.user.username);
        })
        .done(function () { cb(); }, cb);
  });
};
