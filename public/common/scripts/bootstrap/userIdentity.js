angular.module("common").run(function ($rootScope, $timeout, socket) {
  "use strict";

  $rootScope.connected = false;
  socket.connect().then(function (user) {
    $rootScope.identity = user;
    $rootScope.connected = true;
  });
  $rootScope.avatar = function (size) {
    if (!$rootScope.connected) { return null; }
    var url = $rootScope.identity.avatarUrl;
    return url && url + (~url.indexOf("?") ? "&" : "?") + "s=" + size || null;
  };
});
