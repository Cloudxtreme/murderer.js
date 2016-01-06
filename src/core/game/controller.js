"use strict";

var _ = require("lodash");
var Q = require("q");
var marked = require("marked");

var userC = require.main.require("./core/user/controller");
var murderM = require.main.require("./core/murder/model");

var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var contract = require("./services/contract");
var transition = require("./services/transition");
var murder = require("./services/murder");
var participation = require("./services/participation");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

exports.qGameListEntries = gameListEntries;
exports.qDetails = gameDetails;
exports.qPopulated = findByIdPopulated;

exports.qActiveContracts = contract.activeContracts;

exports.qKillByToken = murder.byKill;
exports.qSuicide = murder.bySuicide;

exports.qFindJoined = participation.findJoined;
exports.qJoin = participation.join;
exports.qLeave = participation.leave;

exports.qLock = transition.lock;
exports.qStart = transition.start;
exports.qResume = transition.resume;
exports.qPause = transition.pause;
exports.qStop = transition.stop;
exports.qRemoveSafe = transition.remove;

/*==================================================== Functions  ====================================================*/

function gameListEntries(scope) {
  var query = model
      .find(null, {
        "groups.users.message": 0,
        "groups.users.name": 0,
        description: 0,
        "schedule.start": 0,
        "schedule.activate": 0,
        "schedule.deactivate": 0,
        log: 0
      })
      .populate("author", {username: 1, avatarUrl: 1})
      .populate("rings");
  return Q
      .nbind(query.exec, query)()
      .then(function (games) {
        return _.map(games, function (game) {
          return _.extend(game._doc, {
            passwords: !!(game.passwords && game.passwords.length),
            maySuicide: isSuicideCommittable(scope.user, game),
            rings: game.started ? game.rings.length : game.startMeta.rings
          });
        });
      });
}

function isSuicideCommittable(user, game) {
  return game.started && userC.isModulePermitted(user, "closed") &&
      _.any(game.rings, function (ring) { return ~murder.getIndexIfSuicideCommittable(user._id, ring); });
}

function gameDetails(scope, gameId) {
  var query = model
      .findOne({_id: gameId}, {
        "groups.users.message": 0,
        "schedule.activate": 0,
        "schedule.deactivate": 0,
        log: 0
      })
      .populate("groups.group")
      .populate("author", {username: 1, avatarUrl: 1})
      .populate("rings");
  var murderQuery = murderM // TODO move into murder-controller
      .find({game: gameId})
      .populate("trigger", {username: 1, avatarUrl: 1})
      .sort({cdate: 1});
  return Q.spread([
    Q
        .nbind(query.exec, query)()
        .then(function (game) {
          if (game == null) { return Q.reject("Game not found."); }
          game = game._doc;
          game.maySuicide = isSuicideCommittable(scope.user, game);
          game.rings = _.map(game.rings, function (ring) { return {active: ring.active}; });
          game.passwords = !!(game.passwords && game.passwords.length);
          game.description = game.description && marked(game.description);
          return game;
        }),
    Q.nbind(murderQuery.exec, murderQuery)()
  ], function (game, murders) { return {game: game, murders: murders}; });
}


/**
 * Returns Promise for populated game instance by specified ID.
 * @param scope The scope object.
 * @param gameId The ID of the game to fetch.
 * @param [population] The population options (most likely array of paths).
 * @returns Q Promise of populated game instance.
 */
function findByIdPopulated(scope, gameId, population) {
  if (population == null) { population = ["rings"]; }
  scope.log.debug({gameId: gameId, population: population}, "fetching populated game instance");
  var query = model.findById(gameId).populate("rings");
  return Q.nbind(query.exec, query)();
}
