angular.module("admin").factory("games", function (socket) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    all: function () { return socket.query("games:all"); },

    create: function (game) { return socket.query("game:create", game); },
    lock: function (game) { return socket.query("game:lock", game._id); },
    start: function (game) { return socket.query("game:start", game._id); },
    resume: function (game) { return socket.query("game:resume", game._id); },
    pause: function (game) { return socket.query("game:pause", game._id); },
    stop: function (game) { return socket.query("game:stop", game._id); },
    remove: function (game) { return socket.query("game:remove", game._id); }
  };

  /*=================================================== Functions  ===================================================*/



  /*===================================================== Return =====================================================*/

  return service;
});
