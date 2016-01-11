"use strict";

var _ = require("lodash");
var Q = require("q");
var gameC = require.main.require("./core/game/controller");
var murderC = require.main.require("./core/murder/controller");
var security = require.main.require("./utils/security");

module.exports = function (queryRoute) {
  queryRoute("murder:self", function (data) {
    if (typeof data !== "object" || data == null || typeof data.password !== "string" || typeof data.message !== "string" || typeof data.gameId !== "string" || !data.message.length) {
      return Q.reject("Bad request.");
    }
    if (!security.checkPassword(data.password, this.user.pw)) { return Q.reject("Invalid password."); }
    return gameC.qSuicide(this, this.user._id, data.gameId, data.message).then(_.noop);
  });

  queryRoute("murder:token", function (data) {
    if (typeof data !== "object" || data == null || typeof data.token !== "string" || typeof data.message !== "string" || typeof data.gameId !== "string" || typeof data.ringId !== "string" || !data.message.length) {
      return Q.reject("Bad request.");
    }
    return gameC.qKillByToken(this, this.user._id, data.gameId, data.ringId, data.token, data.message).then(_.noop);
    // TODO return new contract instead of undefined
  });

  queryRoute("murder:upVote", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad request."); }
    return murderC.qUpVote(this, data);
  });
};
