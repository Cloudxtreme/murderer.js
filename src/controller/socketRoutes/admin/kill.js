"use strict";

var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("kill:admin.token", function (data) {
    return gameC.qKillByToken(this, data.murdererId, data.gameId, data.token, data.message, true);
  });

  queryRoute("kill:admin.suicide", function (data) {
    return gameC.qSuicide(this, data.userId, data.gameId, data.message, true);
  });
};
