angular.module("closed").controller("joinGameCtrl", function ($scope, $uibModalInstance, game, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.groups = null;

  $scope.data = {name: null, message: null, groupId: null};

  $scope.dismiss = $uibModalInstance.dismiss;
  $scope.confirm = confirm;

  /*=============================================== Initial Execution  ===============================================*/

  /*------------------------------------------------ Fetch all groups ------------------------------------------------*/

  socket
      .query("groups:populate", _.pluck(game.groups, "group"))
      .then(function (groups) {
        $scope.groups = groups;
        if (groups.length === 1) { $scope.data.groupId = groups[0]._id; }
      });

  /*=================================================== Functions  ===================================================*/

  function confirm() { $uibModalInstance.close($scope.data); }

});
