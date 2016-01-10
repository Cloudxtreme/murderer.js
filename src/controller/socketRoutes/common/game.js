"use strict";

var Q = require("q");

var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("games:all", function () { return gameC.qGameListEntries(this); });

  queryRoute("game:details", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad request."); }
    return gameC.qDetails(this, data);
  });
};
