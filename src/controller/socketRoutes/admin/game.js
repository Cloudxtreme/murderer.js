"use strict";

var _ = require("lodash");

var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("games:admin.all", function (data) { return gameC.qFind(this, data); });

  queryRoute("game:create", function (data) { return gameC.qCreate(this, _.extend(data, {author: this.user._id})); });

  queryRoute("game:lock", function (data) { return gameC.qStart(this, data, false); });

  queryRoute("game:start", function (data) { return gameC.qStart(this, data, true); });

  queryRoute("game:resume", function (data) { return gameC.qFindByIdAndUpdate(this, data, {active: true}); });

  queryRoute("game:pause", function (data) { return gameC.qFindByIdAndUpdate(this, data, {active: false}); });

  queryRoute("game:stop", function (data) {
    return gameC.qFindByIdAndUpdate(this, data, {active: false, ended: true});
  });

  queryRoute("game:remove", function (data) { return gameC.qRemoveById(this, data); });

  //queryRoute("game:details", function (data) { return gameC.qPopulated(data); });

  //queryRoute("game:update", function (data) { return gameC.qFindByIdAndUpdate(this, data._id, data, {new: true}); });

  //queryRoute("game:rings.set", function (data) { return gameC.qGenerateRings(this, data.gameId, data.amount); });

  //queryRoute("game:contracts.all", function (data) { return gameC.qFindContracts(this, data); });
};
