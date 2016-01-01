"use strict";

var _ = require("lodash");
var Q = require("q");

var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var contract = require("./services/contract");
var transition = require("./services/transition");
var murder = require("./services/murder");
var participation = require("./services/participation");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

exports.qGameListEntries = gameListEntries;

exports.qFindContracts = contract.all;

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

function gameListEntries() {
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
      .populate("author", {username: 1, avatarUrl: 1});
  return Q
      .nbind(query.exec, query)()
      .then(function (games) {
        return _.map(games, function (game) {
          return _.extend(game._doc, {
            passwords: !!(game.passwords && game.passwords.length),
            rings: game.started ? game.rings.length : game.startMeta.rings
          });
        });
      });
}
