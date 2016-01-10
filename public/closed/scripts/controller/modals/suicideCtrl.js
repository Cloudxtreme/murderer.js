angular.module("closed").controller("suicideCtrl", function ($scope, $uibModalInstance, game) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.data = {password: null, message: null};
  $scope.game = game;

  $scope.dismiss = $uibModalInstance.dismiss;
  $scope.confirm = confirm;

  /*=================================================== Functions  ===================================================*/

  function confirm() { $uibModalInstance.close($scope.data); }

});
