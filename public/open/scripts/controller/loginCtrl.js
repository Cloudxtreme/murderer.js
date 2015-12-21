angular.module("open").controller("loginCtrl", function (BASE_PATH, CREDENTIALS, $scope, $window, $location, $http) {
  "use strict";

  var lastRequest = -1;

  /*===================================================== Scope  =====================================================*/

  $scope.error = null;
  $scope.loading = null;

  $scope.passwordMinLength = CREDENTIALS.password.min;
  $scope.credentials = {username: null, password: null};

  $scope.login = login;

  /*------------------------------------------------- Scope Watcher  -------------------------------------------------*/

  $scope.$watch("credentials.username", validateUsername);

  /*=================================================== Functions  ===================================================*/

  /*----------------------------------------------------- Login  -----------------------------------------------------*/

  function login() {
    var reqId = ++lastRequest;
    var data = _.clone($scope.credentials);
    $scope.loading = true;
    $scope.error = null;
    $scope.credentials.password = null;
    $http
        .post("/login", data)
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

  function validateUsername(value) { $scope.usernameValid = CREDENTIALS.username.regex.test(value || ""); }

});
