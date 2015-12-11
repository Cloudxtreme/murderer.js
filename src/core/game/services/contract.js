"use strict";

var _ = require("lodash");
var Q = require("q");

var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.all = findAllContracts;

/*==================================================== Functions  ====================================================*/

function findAllContracts(scope, gameId) {
  return controller
      .qPopulated(scope, gameId, ["rings", "groups.users", "groups.group"])
      .then(function (game) {
        scope.log.debug({game: game}, "fetching contracts");
        if (game == null) { return Q.reject("Game not found."); }
        return {
          game: {
            _id: game._id,
            name: game.name,
            groups: _.map(game.groups, function (group) {
              return {
                group: group.group,
                users: _.map(group.users, function (user) { return _.pick(user._doc, ["_id", "username"]); })
              };
            })
          },
          contracts: _.map(game.rings, function (ring) {
            if (ring.active <= 1) { return {resolved: true, survivor: _.findWhere(ring.chain, {murder: null})}; }
            return {resolved: false, list: _.filter(ring.chain, {vulnerable: true})};
          })
        };
      });
}
