angular.module("closed").controller("joinGameCtrl", function ($scope, $timeout, $uibModalInstance, game, games, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.groups = null;

  $scope.data = {name: null, message: null, groupId: null};

  $scope.dismiss = $uibModalInstance.dismiss;
  $scope.confirm = confirm;

  /*=============================================== Initial Execution  ===============================================*/

  /*------------------------------------------------ Fetch all groups ------------------------------------------------*/

  socket
      .query("groups:populate", _.pluck(game.groups, "group")) // TODO create route within server
      .then(function (groups) { $scope.groups = groups; });

  /*=================================================== Functions  ===================================================*/

  function confirm() {
    games
        .join(game, $scope.data)
        .then($uibModalInstance.close, function (err) {
          // TODO proper error handling
          console.error(err);
        });
  }

});
