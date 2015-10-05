angular.module("common").directive("languageSelector", function (locales) {
  "use strict";

  return {
    restrict: "A",
    templateUrl: "/templates/common/language_selector.html",
    link: function ($scope) {
      $scope.locales = locales;
    }
  };
});
