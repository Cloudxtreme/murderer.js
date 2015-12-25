angular.module("common").directive("statsTotal", function (BAR_CHART_INTERVAL_SIZE, stats) {
  "use strict";

  // TODO rework

  return {
    restrict: "C",
    scope: true,
    templateUrl: "/templates/common/stats/total.html",
    link: function ($scope) {
      $scope.total = null;

      stats.analyseTotal(BAR_CHART_INTERVAL_SIZE).then(function (data) { $scope.total = data; });
    }
  };
});
