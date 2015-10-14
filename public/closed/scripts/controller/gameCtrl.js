angular.module("closed").controller("gameCtrl", function ($scope, socket) {
  "use strict";

  $scope.mission = {
    token: null,
    message: null
  };
  $scope.suicide = {
    password: null,
    message: null
  };

  $scope.missionAttempt = function () {
    $scope.missionLoading = true;
    $scope.missionSuccess = false;
    $scope.missionFailed = null;
    var mission = $scope.mission;
    socket.query("kill:token", mission).then(function () {
      $scope.mission.token = $scope.mission.message = null;
      $scope.missionSuccess = true;
      $scope.missionLoading = false;
    }, function (err) {
      $scope.missionFailed = err.message;
      $scope.missionLoading = false;
    });
  };

  $scope.suicideAttempt = function () {
    $scope.suicideLoading = true;
    $scope.suicideSuccess = false;
    $scope.suicideFailed = null;
    var suicide = $scope.suicide;
    socket.query("kill:self", suicide).then(function () {
      $scope.suicide.password = $scope.suicide.message = null;
      $scope.suicideSuccess = true;
      $scope.suicideLoading = false;
    }, function (err) {
      $scope.suicideFailed = err.message;
      $scope.suicideLoading = false;
    });
  };
});
