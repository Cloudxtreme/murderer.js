angular.module("admin").controller("usersCtrl", function ($scope, users) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.users = null;
  $scope.usersInactive = null;

  /*=============================================== Initial Execution  ===============================================*/

  users.activated().then(function (list) { $scope.users = list; });
  users.notActivated().then(function (list) { $scope.usersInactive = list; });

});
