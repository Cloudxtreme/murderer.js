angular.module("closed").factory("games", function (socket) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    all: function () { return socket.query("games:all"); },
    joined: function () { return socket.query("games:joined"); },

    join: function (game, data) { return socket.query("game:join", _.extend(data, {gameId: game._id})); },
    leave: function (game) { return socket.query("game:leave", game._id); },
    suicide: function (game, data) { return socket.query("murder:self", _.extend(data, {gameId: game._id})); },
    kill: function (game, data) { return socket.query("murder:token", _.extend(data, {gameId: game._id})); },

    byId: function (gameId) { return socket.query("game:details", gameId); }
  };

  /*===================================================== Return =====================================================*/

  return service;
});
