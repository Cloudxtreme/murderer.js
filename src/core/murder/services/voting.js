"use strict";

var _ = require("lodash");
var Q = require("q");

var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.upVote = upVote;
exports.hasVoted = hasVoted;

/*==================================================== Functions  ====================================================*/

function upVote(scope, murderId) {
  var userId = scope.user._id;
  return controller
      .qFindById(scope, murderId)
      .then(function (murder) {
        var votes = murder.upVotes.length;
        var query = {};
        if (hasVoted(userId, murder)) {
          query.$pull = {upVotes: userId};
          votes--;
        } else {
          query.$addToSet = {upVotes: userId};
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

function hasVoted(userId, murder) { return _.any(murder.upVotes, function (entry) { return userId.equals(entry); }); }
