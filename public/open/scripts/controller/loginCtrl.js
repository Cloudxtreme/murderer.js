angular.module("open").controller("loginCtrl", function ($scope, $location) {
  "use strict";

  $scope.error = $location.hash() === "failed";

  $scope.credentials = {
    username: null,
    password: null,
  };

});
