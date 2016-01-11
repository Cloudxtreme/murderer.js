"use strict";

var _ = require("lodash");
var Q = require("q");

var controller = require("../controller");

var userC = require.main.require("./core/user/controller");

/*===================================================== Exports  =====================================================*/

exports.upVote = upVote;
exports.mayVote = mayVote;
exports.hasVoted = hasVoted;

/*==================================================== Functions  ====================================================*/

function upVote(scope, murderId) {
  var user = scope.user;
  return controller
      .qFindOne(scope, {_id: murderId, murderer: {$ne: user._id}})
      .then(function (murder) {
        if (murder == null) { return Q.reject("Murder not found or you are the murderer."); }
        var votes = murder.upVotes.length;
        var query = {};
        if (hasVoted(user, murder)) {
          query.$pull = {upVotes: user._id};
          votes--;
        } else {
          query.$addToSet = {upVotes: user._id};
          votes++;
        }
        return controller
            .qUpdateById(scope, murderId, query)
            .then(function (data) {
              if (!data.nModified) { return Q.reject("Update failed."); }
              return votes;
            });
      });
}

function hasVoted(user, murder) { return _.any(murder.upVotes, function (entry) { return user._id.equals(entry); }); }

function mayVote(user, murder) { return userC.isModulePermitted(user, "closed") && !user._id.equals(murder.murderer); }
