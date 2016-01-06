angular.module("closed").controller("suicideCtrl", function ($scope, $uibModalInstance, game, games) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.data = {password: null, message: null};
  $scope.game = game;

  $scope.dismiss = $uibModalInstance.dismiss;
  $scope.confirm = confirm;

  /*=================================================== Functions  ===================================================*/

  function confirm() {
    games
        .suicide(game, $scope.data)
        .then($uibModalInstance.close, function (err) {
          // TODO proper error handling
          console.error(err);
        });
  }

});
