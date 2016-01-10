angular.module("admin").factory("adminGames", function (socket, adminModals) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    all: function () { return socket.query("games:admin.all"); },

    create: create,
    lock: function (game) { return socket.query("game:lock", game._id); }, // TODO confirm modal
    start: function (game) { return socket.query("game:start", game._id); }, // TODO confirm modal
    resume: function (game) { return socket.query("game:resume", game._id); },
    pause: function (game) { return socket.query("game:pause", game._id); },
    stop: function (game) { return socket.query("game:stop", game._id); }, // TODO confirm modal
    remove: function (game) { return socket.query("game:remove", game._id); }, // TODO confirm modal

    prepareGameListView: prepareGameListView
  };

  /*=================================================== Functions  ===================================================*/

  function prepareGameListView(game) {
    game.participants = _.sum(_.map(game.groups, function (g) { return g.users.length; }));
    game.state = game.ended ? "stopped" : game.active ? "running" : game.started ? "paused" : "initial";
    return game;
  }

  function create() {
    return adminModals.qCreateGame().then(function (data) { return socket.query("game:create", data); });
  }

  /*===================================================== Return =====================================================*/

  return service;
});
