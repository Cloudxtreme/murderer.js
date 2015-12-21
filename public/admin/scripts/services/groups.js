angular.module("admin").factory("groups", function (socket) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    all: function () { return socket.query("groups:all"); },
    create: function (data) { return socket.query("group:create", data); },
    update: function (data) { return socket.query("group:update", data); },
    remove: function (id) { return socket.query("group:remove", id); }
  };

  /*===================================================== Return =====================================================*/

  return service;
});
