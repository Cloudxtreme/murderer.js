angular.module("closed").controller("contractsCtrl", function ($scope, $rootScope, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.games = null;

  /*=============================================== Initial Execution  ===============================================*/

  socket.query("contracts:active").then(function (games) { $scope.games = games; });

});
