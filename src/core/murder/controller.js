"use strict";

var _ = require("lodash");
var Q = require("q");

var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");
var socket = require.main.require("./controller/socket");

var gameC = require.main.require("./core/game/controller");

var populate = require("./services/populate");
var voting = require("./services/voting");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

exports.qNewsBroadcast = newsBroadcast;

exports.qNews = news;
exports.qUpVote = voting.upVote;

/*==================================================== Functions  ====================================================*/

function newsBroadcast() {
  return populate.newsInstance.apply(null, arguments).then(function (instance) {
    socket.broadcastCommonPermitted("game:kill.committed", instance);
  });
}

function news(scope) {
  var user = scope.user;
  var query = model
      .find()
      .sort("-cdate")
      .populate("trigger", {username: 1, avatarUrl: 1})
      .limit(20); // TODO add pagination
  var gameProjection = {"groups.users.name": 1, "groups.users.user": 1, name: 1, rings: 1};
  return Q.spread([
        Q.nbind(query.exec, query)().then(function (murders) {
          return _.each(murders, function (murder) {
            murder = murder._doc;
            murder.hasUpVoted = (murder.mayUpVote = voting.mayVote(user, murder)) && voting.hasVoted(user, murder);
            murder.upVotes = murder.upVotes.length;
          });
        }),
        gameC.qFind(scope, {started: true}, gameProjection)
      ],
      function (murders, games) { return {games: games, murders: murders}; }
  );
}
