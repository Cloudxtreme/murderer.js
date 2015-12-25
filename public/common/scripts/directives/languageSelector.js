angular.module("common").directive("languageSelector", function (locales) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  return {
    restrict: "C",
    templateUrl: "/templates/common/language_selector.html",
    link: function ($scope) { $scope.locales = locales; }
  };
});
