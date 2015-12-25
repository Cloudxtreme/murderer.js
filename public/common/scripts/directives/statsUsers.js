angular.module("common").directive("statsUsers", function (stats) {
  "use strict";

  // TODO rework

  return {
    restrict: "C",
    scope: true,
    templateUrl: "/templates/common/stats/users.html",
    link: function ($scope) {
      $scope.users = [];
      $scope.displayedUsers = [];

      stats.analyseUsers().then(function (data) {
        var pick = _.partial(_.pick, _, ["username", "total"]);
        Array.prototype.splice.apply($scope.users, [0, $scope.users.length].concat(_.map(data.users, pick)));
        // uncomment for styling
        //$scope.users.push({username: "Avedo", total: {kills: 3, active: 1}});
        //$scope.users.push({username: "FDG", total: {kills: 2, active: 4}});
        //$scope.users.push({username: "friss", total: {kills: 9, active: 1}});
        //$scope.users.push({username: "die", total: {kills: 12, active: 2}});
        //$scope.users.push({username: "gurke", total: {kills: 3, active: 1}});
        //$scope.users.push({username: "wanted", total: {kills: 2, active: 0}});
        //$scope.users.push({username: "asterisk", total: {kills: 3, active: 0}});
      });
    }
  };
});
