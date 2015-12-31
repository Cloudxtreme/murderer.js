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
    $rootScope.connected = true;
  });

  /*=================================================== Functions  ===================================================*/

  function getAvatar(size, url) {
    if (!$rootScope.connected) { return null; }
    if (url == null) { url = $rootScope.identity.avatarUrl; }
    return url && url + (~url.indexOf("?") ? "&" : "?") + "s=" + size || null;
  }

});
