angular.module("common").run(function ($rootScope, $timeout, socket) {
  "use strict";

  $rootScope.connected = false;
  socket.connect().then(function (user) {
    $rootScope.identity = user;
    $rootScope.connected = true;
  });
});
