angular.module("common").directive("cookieNotice", function (cookiesAccepted) {
  "use strict";

  return {
    restrict: "C",
    templateUrl: "/templates/common/cookie_notice.html",
    link: function ($scope, $element) {
      if (cookiesAccepted.init() === true) { return $element.remove(); }

      $scope.acceptCookies = function () {
        var expire = new Date();
        expire.setFullYear(expire.getFullYear() + 5);
        cookiesAccepted.accept(expire);
        $element.remove();
      };

      $scope.rejectCookies = function () {
        cookiesAccepted.reject();
        $element.remove();
      };
    }
  };
});
