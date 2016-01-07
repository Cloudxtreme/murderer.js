angular.module("closed").controller("contractCtrl", function ($scope, modals) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.hide = true;

  $scope.attemptTokenKill = attemptTokenKill;

  $scope.$watch("collapseOverwrite", function (value) { $scope.hide = value; });

  /*=================================================== Functions  ===================================================*/

  function attemptTokenKill() {
    modals
        .qKill($scope.contract.game, $scope.contract.details.ringId, $scope.contract.ring)
        .then(function (contract) {
          // TODO proper response handling
          console.log(contract);
        });
  }

});
