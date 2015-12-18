"use strict";

var gameC = require.main.require("./core/game/controller");

module.exports = function (queryRoute) {
  queryRoute("games:all", function (data) { return gameC.qFind(this, data); });

  queryRoute("game:create", function (data) { return gameC.qCreate(this, data); });

  queryRoute("game:details", function (data) { return gameC.qPopulated(data); });

  queryRoute("game:update", function (data) {
    return gameC.qFindByIdAndUpdate(this, {_id: data._id}, data, {new: true});
  });

  queryRoute("game:rings.set", function (data) { return gameC.qGenerateRings(this, data.gameId, data.amount); });

  queryRoute("game:contracts.all", function (data) { return gameC.qFindContracts(this, data); });
};
