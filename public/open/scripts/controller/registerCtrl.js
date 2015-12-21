angular.module("open").controller("registerCtrl", function (BASE_PATH, CREDENTIALS, $scope, $window, $location, $http, socket) {
  "use strict";

  var lastRequest = -1;
  var lastUsernameRequest = -1, usernameResponses = {};
  var lastEmailRequest = -1, emailResponses = {};

  /*===================================================== Scope  =====================================================*/

  $scope.error = null;
  $scope.loading = null;
  $scope.passwordConfirm = null;
  $scope.usernameTaken = null;
  $scope.usernameValid = null;
  $scope.emailTaken = null;
  $scope.passwordConfirmMatches = null;
  $scope.passwordConfirmLength = null;

  $scope.passwordMinLength = CREDENTIALS.password.min;
  $scope.usernameMinLength = CREDENTIALS.username.min;
  $scope.credentials = {username: null, password: null, email: null};

  $scope.register = register;

  /*------------------------------------------------- Scope Watcher  -------------------------------------------------*/

  $scope.$watch("credentials.username", validateUsername);
  $scope.$watch("credentials.email", validateEmail);

  $scope.$watchGroup(["credentials.password", "passwordConfirm"], validatePasswordConfirm);

  /*=================================================== Functions  ===================================================*/

  /*-------------------------------------------------- Registration --------------------------------------------------*/

  function register() {
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
  }

  /*--------------------------------------------------- Validation ---------------------------------------------------*/

  function validateEmail(value) {
    if (value) {
      var reqId = ++lastEmailRequest;
      if (emailResponses.hasOwnProperty(value)) {
        emailResponses[value].then(function (val) {
          if (reqId === lastEmailRequest) { $scope.emailTaken = val; }
        });
      } else {
        emailResponses[value] = socket
            .query("exists:email", value)
            .then(function (val) {
              if (reqId === lastEmailRequest) { $scope.emailTaken = val; }
              return val;
            });
      }
    }
  }

  function validatePasswordConfirm(data) {
    var password = data[0], confirm = data[1];
    $scope.passwordConfirmMatches = (password != null || confirm != null) && password === confirm;
    $scope.passwordConfirmLength = $scope.passwordConfirmMatches ||
        password != null && confirm != null && password.length === confirm.length;
  }

  function validateUsername(value) {
    $scope.usernameValid = CREDENTIALS.username.regex.test(value || "");
    if (value) {
      var reqId = ++lastUsernameRequest;
      if (usernameResponses.hasOwnProperty(value)) {
        usernameResponses[value].then(function (val) {
          if (reqId === lastUsernameRequest) { $scope.usernameTaken = val; }
        });
      } else {
        usernameResponses[value] = socket
            .query("exists:username", value)
            .then(function (val) {
              if (reqId === lastUsernameRequest) { $scope.usernameTaken = val; }
              return val;
            });
      }
    }
  }

});
