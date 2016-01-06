"use strict";

var Q = require("q");
var gameC = require.main.require("./core/game/controller");
var security = require.main.require("./utils/security");

module.exports = function (queryRoute) {
  queryRoute("murder:self", function (data) {
    if (typeof data !== "object" || data == null || typeof data.password !== "string" || typeof data.message !== "string" || typeof data.gameId !== "string" || !data.message.length) {
      return Q.reject("Bad request.");
    }
    if (!security.checkPassword(data.password, this.user.pw)) { return Q.reject("Invalid password."); }
    return gameC.qSuicide(this, this.user._id, data.gameId, data.message);
  });

  queryRoute("murder:token", function (data) {
    if (typeof data !== "object" || data == null || typeof data.token !== "string" || typeof data.message !== "string" || typeof data.gameId !== "string" || !data.message.length) {
      return Q.reject("Bad request.");
    }
    return gameC.qKillByToken(this, this.user._id, data.gameId, data.token, data.message);
  });
};