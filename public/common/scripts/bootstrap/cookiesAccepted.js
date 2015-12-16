angular.module("common").run(function ($cookies, $rootScope) {
  "use strict";

  $rootScope.cookiesAccepted = $cookies.get("cookiesAccepted") === "1" ? true : null;

  $rootScope.acceptCookies = function () {
    console.log(1);
    var expire = new Date();
    expire.setFullYear(expire.getFullYear() + 5);
    $cookies.put("cookiesAccepted", "1", {expires: expire});
    $rootScope.cookiesAccepted = true;
  };
});
