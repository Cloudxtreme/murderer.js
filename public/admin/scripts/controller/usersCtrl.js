angular.module("admin").controller("usersCtrl", function ($scope, users) {
  "use strict";

  $scope.users = [];
  $scope.usersInactive = [];

  users.activated().then(function (list) { $scope.users = list; });
  users.notActivated().then(function (list) { $scope.usersInactive = list; });

});
