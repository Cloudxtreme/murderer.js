angular.module("common").run(function ($rootScope, cookiesAccepted) {
  "use strict";

  $rootScope.cookiesAccepted = cookiesAccepted.init();

  $rootScope.acceptCookies = function () {
    var expire = new Date();
    expire.setFullYear(expire.getFullYear() + 5);
    cookiesAccepted.accept(expire);
    $rootScope.cookiesAccepted = true;
  };

  $rootScope.rejectCookies = function () {
    cookiesAccepted.reject();
    $rootScope.cookiesAccepted = false;
  };
});

// tidy up cookies created by 3rd-party scripts, not needed
angular.module("common").run(function (localStorage) {
  "use strict";

  localStorage.remove("debug");
});
