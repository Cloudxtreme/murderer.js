"use strict";

var _ = require("lodash");

var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("games:admin.all", function (data) { return gameC.qFind(this, data); });

  queryRoute("game:create", function (data) { return gameC.qCreate(this, _.extend(data, {author: this.user._id})); });

  queryRoute("game:lock", function (data) { return gameC.qLock(this, data); });
  queryRoute("game:start", function (data) { return gameC.qStart(this, data); });
  queryRoute("game:resume", function (data) { return gameC.qResume(this, data); });
  queryRoute("game:pause", function (data) { return gameC.qPause(this, data); });
  queryRoute("game:stop", function (data) { return gameC.qStop(this, data); });
  queryRoute("game:remove", function (data) { return gameC.qRemoveSafe(this, data); });

  //queryRoute("game:details", function (data) { return gameC.qPopulated(data); });

  //queryRoute("game:contracts.all", function (data) { return gameC.qFindContracts(this, data); });
};
