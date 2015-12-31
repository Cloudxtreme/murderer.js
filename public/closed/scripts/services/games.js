angular.module("closed").factory("games", function (socket) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    all: function () { return socket.query("games:all"); },
    joined: function () { return socket.query("games:joined"); },

    join: function (game, data) { return socket.query("game:join", _.extend(data, {gameId: game._id})); },
    leave: function (game) { return socket.query("game:leave", game._id); }
  };

  /*===================================================== Return =====================================================*/

  return service;
});
