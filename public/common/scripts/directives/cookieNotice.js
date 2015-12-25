angular.module("common").directive("cookieNotice", function (cookiesAccepted) {
  "use strict";

  var EXPIRE_YEARS = 5;

  /*==================================================== Exports  ====================================================*/

  return {
    restrict: "C",
    templateUrl: "/templates/common/cookie_notice.html",
    link: link
  };

  /*=================================================== Functions  ===================================================*/

  function acceptCookies() {
    var expire = new Date();
    expire.setFullYear(expire.getFullYear() + EXPIRE_YEARS);
    cookiesAccepted.accept(expire);
  }

  function rejectCookies() { cookiesAccepted.reject(); }

  /*------------------------------------------------------ Link ------------------------------------------------------*/

  function link($scope, $element) {
    if (cookiesAccepted.init() === true) { return $element.remove(); }
    $scope.acceptCookies = function () {
      acceptCookies();
      $element.remove();
    };
    $scope.rejectCookies = function () {
      rejectCookies();
      $element.remove();
    };
  }

});
