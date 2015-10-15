angular.module("open").controller("registerCtrl", function ($scope, $location, socket) {
  "use strict";

  $scope.error = $location.hash();

  $scope.credentials = {
    username: null,
    group: null,
    email: null,
    profileMessage: null,
    password: null,
    passwordConfirm: null
  };

  $scope.groups = null;

  socket.query("groups:get").then(function (groups) {
    $scope.groups = _.each(groups, function (g) { g.string = g.name + " (" + g.tutors + ")"; });
  });

  $scope.$watch("credentials.username", function (username) {
    $scope.usernameValid = username ? /^[a-z_ 0-9-]{3,}$/.test(username) : true;
  });

  $scope.$watchGroup(["credentials.password", "credentials.passwordConfirm"], function (data) {
    $scope.passwordConfirmValid = data[0] === data[1];
  });

});
