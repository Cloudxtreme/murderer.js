angular.module("closed").directive("contract", function () {
  "use strict";

  return {
    restrict: "A",
    scope: {
      contract: "="
    },
    templateUrl: "/templates/closed/contract.html",
    link: function ($scope) {
      $scope.$watch("::contract", function (contract) {
        if (contract != null) { $scope.alias = contract.details.alias || contract.game.alias; }
      });
    }
  };
});
