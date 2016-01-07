"use strict";

var Q = require("q");

var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");
var socket = require.main.require("./controller/socket");

var gameC = require.main.require("./core/game/controller");

var populate = require("./services/populate");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

exports.qNewsBroadcast = newsBroadcast;

exports.qNews = news;

/*==================================================== Functions  ====================================================*/

function newsBroadcast() {
  return populate.newsInstance.apply(null, arguments).then(function (instance) {
    socket.broadcastCommonPermitted("game:kill.committed", instance);
  });
}

function news(scope) {
  var query = model
      .find()
      .sort("-cdate")
      .populate("trigger", {username: 1, avatarUrl: 1})
      .limit(20); // TODO add pagination
  var gameProjection = {"groups.users.name": 1, "groups.users.user": 1, name: 1, rings: 1};
  return Q.spread(
      [Q.nbind(query.exec, query)(), gameC.qFind(scope, {started: true}, gameProjection)],
      function (murders, games) { return {games: games, murders: murders}; }
  );
}
