angular.module("closed").controller("gameCtrl", function ($scope, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.missionLoading = null;
  $scope.missionSuccess = null;
  $scope.missionFailed = null;
  $scope.suicideLoading = null;
  $scope.suicideSuccess = null;
  $scope.suicideFailed = null;

  $scope.mission = {token: null, message: null};
  $scope.suicide = {password: null, message: null};

  $scope.missionAttempt = kill;
  $scope.suicideAttempt = suicide;

  /*=================================================== Functions  ===================================================*/

  function kill() {
    $scope.missionLoading = true;
    $scope.missionSuccess = false;
    $scope.missionFailed = null;
    var data = $scope.mission;
    socket.query("kill:token", data).then(function () {
      $scope.mission.token = $scope.mission.message = null;
      $scope.missionSuccess = true;
      $scope.missionLoading = false;
    }, function (err) {
      $scope.missionFailed = err.message;
      $scope.missionLoading = false;
    });
  }

  function suicide() {
    $scope.suicideLoading = true;
    $scope.suicideSuccess = false;
    $scope.suicideFailed = null;
    var data = $scope.suicide;
    socket.query("kill:self", data).then(function () {
      $scope.suicide.password = $scope.suicide.message = null;
      $scope.suicideSuccess = true;
      $scope.suicideLoading = false;
    }, function (err) {
      $scope.suicideFailed = err.message;
      $scope.suicideLoading = false;
    });
  }

});
