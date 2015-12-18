angular.module("open").controller("registerCtrl", function (BASE_PATH, CREDENTIALS, $scope, $window, $location, $http, socket) {
  "use strict";

  var lastRequest = -1;
  var lastUsernameRequest = -1, usernameResponses = {};
  var lastEmailRequest = -1, emailResponses = {};

  $scope.error = null;
  $scope.loading = null;
  $scope.passwordMinLength = CREDENTIALS.password.min;
  $scope.usernameMinLength = CREDENTIALS.username.min;
  $scope.passwordConfirm = null;
  $scope.credentials = {
    username: null,
    password: null,
    email: null
  };

  $scope.$watch("credentials.username", function (value) {
    $scope.usernameValid = CREDENTIALS.username.regex.test(value || "");
    if (value) {
      var reqId = ++lastUsernameRequest;
      if (usernameResponses.hasOwnProperty(value)) {
        usernameResponses[value].then(function (val) {
          if (reqId === lastUsernameRequest) { $scope.usernameTaken = val; }
        });
        return;
      }
      usernameResponses[value] = socket
          .query("exists:username", value)
          .then(function (val) {
            if (reqId === lastUsernameRequest) { $scope.usernameTaken = val; }
            return val;
          });
    }
  });

  $scope.$watch("credentials.email", function (value) {
    if (value) {
      var reqId = ++lastEmailRequest;
      if (emailResponses.hasOwnProperty(value)) {
        emailResponses[value].then(function (val) {
          if (reqId === lastEmailRequest) { $scope.emailTaken = val; }
        });
        return;
      }
      emailResponses[value] = socket
          .query("exists:email", value)
          .then(function (val) {
            if (reqId === lastEmailRequest) { $scope.emailTaken = val; }
            return val;
          });
    }
  });

  $scope.$watchGroup(["credentials.password", "passwordConfirm"], function (data) {
    $scope.passwordConfirmMatches = (data[0] != null || data[1] != null) && data[0] === data[1];
    $scope.passwordConfirmLength = $scope.passwordConfirmMatches ||
        data[0] != null && data[1] != null && data[0].length === data[1].length;
  });

  $scope.register = function () {
    var reqId = ++lastRequest;
    var data = _.clone($scope.credentials);
    $scope.loading = true;
    $scope.error = null;
    $scope.credentials.password = null;
    $http
        .post("/register", data)
        .then(function () {
          $scope.loading = $scope.error = null;
          $window.location.href = BASE_PATH;
        }, function (err) {
          if (reqId !== lastRequest) { return; }
          if (err.status === 429) { $scope.credentials.password = data.password; }
          $scope.loading = null;
          $scope.error = err;
        });
  };

});
