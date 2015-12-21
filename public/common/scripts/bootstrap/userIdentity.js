angular.module("common").run(function ($rootScope, $timeout, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $rootScope.identity = null;
  $rootScope.connected = false;

  $rootScope.avatar = getAvatar;

  /*=============================================== Initial Execution  ===============================================*/

  socket.connect();

  socket.promises.identified.then(function (user) {
    $rootScope.identity = user;
    console.log("id", user);
    $rootScope.connected = true;
  });
  socket.promises.authorized.then(function (user) {
    console.log("au", user);
  });

  /*=================================================== Functions  ===================================================*/

  function getAvatar(size) {
    if (!$rootScope.connected) { return null; }
    var url = $rootScope.identity.avatarUrl;
    return url && url + (~url.indexOf("?") ? "&" : "?") + "s=" + size || null;
  }

});
