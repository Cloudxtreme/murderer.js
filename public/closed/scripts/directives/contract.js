angular.module("closed").directive("contract", function () {
  "use strict";

  var PROJECT = {project: "murderer.js", game: "M&ouml;rderspiel"};
  var PRINT_CLASS = "contract-print-layout";

  return {
    restrict: "A",
    scope: {
      contract: "=",
      printLayout: "=",
      collapseOverwrite: "="
    },
    templateUrl: "/templates/closed/contract.html",
    controller: "contractCtrl",
    link: function ($scope, $element) {
      $scope.project = PROJECT;
      $scope.$watch("printLayout", function (value) {
        if (value) { $element.addClass(PRINT_CLASS); } else { $element.removeClass(PRINT_CLASS); }
      });
      $scope.$watch("::contract", function (contract) {
        if (contract != null) { $scope.alias = contract.details.alias || contract.game.alias; }
      });
    }
  };
});
