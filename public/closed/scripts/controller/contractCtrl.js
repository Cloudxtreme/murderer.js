angular.module("closed").controller("contractCtrl", function ($scope, socket) {
  "use strict";

  $scope.game = null;
  $scope.rings = null;

  socket.query("game:contracts").then(function (result) {
    $scope.game = result.game;
    $scope.rings = result.rings;
  });
});
