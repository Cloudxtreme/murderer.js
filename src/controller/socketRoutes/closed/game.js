"use strict";

var Q = require("q");

var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("games:all", function () { return gameC.qGameListEntries(this); });

  queryRoute("games:joined", function () { return gameC.qFindJoined(this); });

  queryRoute("game:join", function (data) {
    if (typeof data !== "object" || data == null || typeof data.gameId !== "string" || typeof data.name !== "string" || !data.name.length || typeof data.message !== "string" || !data.message.length || typeof data.groupId !== "string") {
      return Q.reject("Bad request.");
    }
    return gameC.qJoin(this, data.gameId, data.name, data.message, data.groupId);
  });

  queryRoute("game:leave", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad request."); }
    return gameC.qLeave(this, data);
  });

  queryRoute("game:details", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad request."); }
    return gameC.qDetails(this, data);
  });

};
