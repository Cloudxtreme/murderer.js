"use strict";

var _ = require("lodash");
var Q = require("q");

var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.findJoined = findJoined;
exports.join = join;
exports.leave = leave;

/*==================================================== Functions  ====================================================*/

function findJoined(scope) {
  return controller
      .qFind(scope, {"groups.users.user": scope.user._id}, {_id: 1})
      .then(function (games) { return _.pluck(games, "_id"); });
}

function getJoinErrorOrGroupIndex(groups, groupId, userId, name) {
  var err = null, groupIdx = null;
  var groupCheck = function (group, i) {
    if (group.group.toString() === groupId) { groupIdx = i; }
    return _.any(group.users, function (u) {
      return err = u.user === userId ? "Already joined." : u.name === name ? "Name already in use." : null;
    });
  };
  if (_.any(groups, groupCheck)) { return Q.reject(err); }
  if (groupIdx == null) { return Q.reject("Group not found."); }
  return groupIdx;
}

function join(scope, gameId, name, message, groupId) {
  var userId = scope.user._id;
  return controller
      .qFindById(scope, gameId)
      .then(function (game) {
        if (game.started) { return Q.reject("Game already locked."); }
        return getJoinErrorOrGroupIndex(game.groups, groupId, userId, name);
      })
      .then(function (groupIdx) {
        var push = {};
        push["groups." + groupIdx + ".users"] = {user: userId, name: name, message: message};
        scope.log.info({gameId: gameId, name: name, groupIdx: groupIdx}, "user joins game");
        return controller.qFindByIdAndUpdate(scope, gameId, {$push: push}, {new: true});
      })
      .then(groupsDataOnly);
}

function groupsDataOnly(game) {
  return {
    groups: _.map(game.groups, function (group) { return {group: group.group, users: _.pluck(group.users, "user")}; })
  };
}

function leave(scope, gameId) {
  var userId = scope.user._id;
  return controller
      .qFindOneAndUpdate(scope,
          {_id: gameId, started: false, "groups.users.user": userId},
          {$pull: {"groups.$.users": {user: userId}}},
          {new: true})
      .then(function (game) {
        scope.log.info({game: game}, "user left game");
        return game;
      })
      .then(groupsDataOnly);
}