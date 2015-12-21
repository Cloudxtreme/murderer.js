angular.module("closed").controller("gameContractsCtrl", function ($scope, $rootScope, socket, gameId) {
  "use strict";

  // TODO code quality

  var res = null;

  $scope.game = null;
  $scope.resolved = null;
  $scope.contracts = null;
  $scope.participants = null;
  $scope.allParticipants = null;

  $scope.filter = {
    ring: null,
    group: null,
    mission: null,
    murderer: null
  };

  socket.query("game:contracts.all", gameId).then(function (result) {
    $scope.game = result.game;
    $scope.rings = _.times(result.game.rings, _.identity);
    $scope.groups = _.each(result.groups, function (g) { g.string = g.name + " (" + g.tutors + ")"; });
    $scope.participants = result.participants;
    $scope.allParticipants = result.participants;
    res = result;
  });

  $scope.$watchGroup([function () { return res; }, "filter.group"], function (data) {
    if (data[0] != null) {
      $scope.participants = data[0].participants;
      if (data[1] != null) {
        $scope.participants = _.filter($scope.participants, function (p) { return p.group === data[1]; });
      }
    }
  });

  $scope.$watchGroup([
    function () { return res; },
    "filter.ring",
    "filter.group",
    "filter.mission",
    "filter.murderer"
  ], function (data) {
    var f;
    if (data[0] != null) {
      $scope.contracts = data[0].contracts;
      $scope.resolved = data[0].resolved;
      if (data[1] != null) {
        var ringCheck = function (r) { return r.ring === data[1]; };
        $scope.contracts = _.filter($scope.contracts, ringCheck);
        $scope.resolved = _.filter($scope.resolved, ringCheck);
      }
      if (data[2] != null) {
        f = data[2];
        $scope.contracts = _.filter($scope.contracts, function (c) { return c.murderer.group === f; });
        $scope.resolved = _.filter($scope.resolved, function (r) { return r.survivor.group === f; });
      }
      if (data[3] != null) {
        f = data[3];
        $scope.contracts = _.filter($scope.contracts, function (c) { return ~c.mission.usernameLower.indexOf(f); });
        $scope.resolved = [];
      }
      if (data[4] != null) {
        f = data[4];
        $scope.contracts = _.filter($scope.contracts, function (c) { return ~c.murderer.usernameLower.indexOf(f); });
        $scope.resolved = _.filter($scope.resolved, function (r) { return ~r.survivor.usernameLower.indexOf(f); });
      }
    }
  });
});
