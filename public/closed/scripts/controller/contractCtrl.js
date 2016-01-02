angular.module("closed").controller("contractCtrl", function (TOKEN_SIZE, $scope, socket) {
  "use strict";

  var REGEX_HEX = /^[a-fA-F0-9]+$/i;

  /*===================================================== Scope  =====================================================*/

  $scope.token = null;

  $scope.hide = true;
  $scope.tokenLength = TOKEN_SIZE * 2; // two hex-chars per byte

  $scope.attemptTokenKill = attemptTokenKill;
  $scope.isHex = function (value) { return REGEX_HEX.test(value); };

  /*=================================================== Functions  ===================================================*/

  function attemptTokenKill() {
    socket.query("kill:token", {ringId: $scope.contract.details.ringId, token: $scope.token});
    // TODO implement query-route
    // TODO handle result
  }

});
