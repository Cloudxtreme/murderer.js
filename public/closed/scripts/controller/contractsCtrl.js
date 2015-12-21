angular.module("closed").controller("contractsCtrl", function ($scope, $rootScope, socket) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.game = null;
  $scope.rings = null;

  /*=============================================== Initial Execution  ===============================================*/

  socket.query("game:contracts").then(function (result) {
    $scope.game = result.game;
    $scope.rings = result.rings;

    // uncomment for layout tests
    //result.rings[0] = {resolved: true, ring: 0, lastSurvivor: {_id: "test-id", username: "Asterisk"}};
    //result.rings[1] = {active: true, ring: 1, mission: {_id: "test-id", username: "Asterisk"}, token: "DEADBEEF"};
    //result.rings[2] = {resolved: true, ring: 2, lastSurvivor: $rootScope.identity};
    //result.rings[3] = {resolved: false, ring: 3};
    //result.rings[4] = {resolved: true, ring: 4, lastSurvivor: null};
  });

});
