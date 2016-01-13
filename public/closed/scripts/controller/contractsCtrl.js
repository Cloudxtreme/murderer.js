angular.module("closed").controller("contractsCtrl", function ($scope, $rootScope, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.games = null;
  $scope.allGames = null;
  $scope.gameFilter = null;

  $scope.collapsed = true;
  $scope.compact = true;
  $scope.contractsOnly = false;
  $scope.activeOnly = false;

  $scope.$watchGroup(["allGames", "gameFilter"], function () {
    $scope.games = $scope.gameFilter ? [_.findWhere($scope.allGames, {_id: $scope.gameFilter})] : $scope.allGames;
  });

  /*=============================================== Initial Execution  ===============================================*/

  socket.query("contracts:active").then(function (games) { $scope.allGames = games; });

});
