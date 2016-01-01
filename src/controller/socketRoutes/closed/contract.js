"use strict";

var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("contracts:active", function () { return gameC.qActiveContracts(this); });
};
