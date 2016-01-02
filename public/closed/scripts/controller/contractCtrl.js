angular.module("closed").controller("contractCtrl", function (TOKEN_SIZE, $scope, adminModals) {
  "use strict";

  var REGEX_HEX = /^[a-fA-F0-9]+$/i;

  /*===================================================== Scope  =====================================================*/

  $scope.hide = true;
  $scope.tokenLength = TOKEN_SIZE * 2; // two hex-chars per byte

  $scope.attemptTokenKill = attemptTokenKill;
  $scope.isHex = function (value) { return REGEX_HEX.test(value); };

  $scope.$watch("collapseOverwrite", function (value) { $scope.hide = value; });

  /*=================================================== Functions  ===================================================*/

  function attemptTokenKill() {
    // TODO open modal
    //socket.query("kill:token", {ringId: $scope.contract.details.ringId, token: $scope.token});
    // TODO implement query-route
    // TODO handle result
  }

});
