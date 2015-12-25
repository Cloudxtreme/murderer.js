angular.module("common").directive("statsGroupsRings", function ($rootScope, $translate, stats) {
  "use strict";

  // TODO rework

  var languageListeners = [];

  $rootScope.$on("language.update", function () { _.each(languageListeners, _.attempt); });

  return {
    restrict: "C",
    scope: true,
    templateUrl: "/templates/common/stats/groups_rings.html",
    link: function ($scope) {
      var chartDataPlain = null;

      $scope.chartGroupsKills = {};
      $scope.chartGroupsActive = {};
      $scope.chartRings = {};
      $scope.chartLives = {};

      function updateChartSchema() {
        if (chartDataPlain != null) {
          var ringLabels = _.map(chartDataPlain.rings, function (ignored, idx) {
            return $translate.instant("game.ring") + " #" + idx;
          });
          var livesLabels = _.times(chartDataPlain.rings.length + 1, function (i) {
            return $translate.instant("game.stats.lives", {amount: i});
          });

          $scope.chartGroupsKills.labels = chartDataPlain.groupOrder;
          $scope.chartGroupsKills.generator = function (g) { return g.kills; };
          $scope.chartGroupsActive.labels = chartDataPlain.groupOrder;
          $scope.chartGroupsActive.generator = function (g) { return g.active; };
          $scope.chartRings.labels = ringLabels;
          $scope.chartRings.generator = function (ring) { return ring.active; };
          $scope.chartLives.labels = livesLabels;
          $scope.chartLives.generator = function (lives) { return lives.active; };
        }
      }

      function updateChartEntries() {
        if (chartDataPlain != null) {
          var groupsKillsEntries = _.map(chartDataPlain.groupOrder, function (g) {
            return $scope.chartGroupsKills.generator(chartDataPlain.groups[g]);
          });
          var groupsActiveEntries = _.map(chartDataPlain.groupOrder, function (g) {
            return $scope.chartGroupsActive.generator(chartDataPlain.groups[g]);
          });

          $scope.chartGroupsKills.data = groupsKillsEntries;
          $scope.chartGroupsActive.data = groupsActiveEntries;
          $scope.chartRings.data = _.map(chartDataPlain.rings, $scope.chartRings.generator);
          $scope.chartLives.data = chartDataPlain.usersByLives;
        }
      }

      stats.analyseUsers().then(function (data) {
        chartDataPlain = data;
        updateChartSchema();
        updateChartEntries();
      });

      languageListeners.push(updateChartSchema);

      $scope.$on("$destroy", function () {
        languageListeners.splice(_.indexOf(languageListeners, updateChartSchema), 1);
      });
    }
  };
});
