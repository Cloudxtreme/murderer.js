angular.module("closed").controller("killCtrl", function (TOKEN_SIZE, $scope, $uibModalInstance, game, ringIndex) {
  "use strict";

  var REGEX_HEX = /^[a-fA-F0-9]+$/i;

  /*===================================================== Scope  =====================================================*/

  $scope.tokenLength = TOKEN_SIZE * 2; // two hex-chars per byte
  $scope.data = {token: null, message: null};
  $scope.game = game;
  $scope.ringIdx = ringIndex;

  $scope.dismiss = $uibModalInstance.dismiss;
  $scope.confirm = confirm;
  $scope.isHex = function (value) { return REGEX_HEX.test(value); };

  /*=================================================== Functions  ===================================================*/

  function confirm() { $uibModalInstance.close($scope.data); }

});
