angular.module("admin").factory("users", function (socket) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    activated: function () { return socket.query("users:activated"); },
    notActivated: function () { return socket.query("users:not-activated"); },
    update: function (data) { return socket.query("user:update", data); },
    remove: function (id) { return socket.query("user:remove", id); }
  };

  /*===================================================== Return =====================================================*/

  return service;
});
