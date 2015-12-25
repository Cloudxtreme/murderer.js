angular.module("common").directive("statsKillsSuicides", function (BAR_CHART_INTERVAL_SIZE, $rootScope, $translate, stats) {
  "use strict";

  // TODO rework

  var languageListeners = [];

  $rootScope.$on("language.update", function () { _.each(languageListeners, _.attempt); });

  return {
    restrict: "C",
    scope: true,
    templateUrl: "/templates/common/stats/kills_suicides.html",
    link: function ($scope) {
      var chartDataPlain = null;

      $scope.chartData = {};
      $scope.chartOptions = {
        scaleOverride: true,
        tooltipFillColor: "rgba(255,255,255,0.1)",
        scaleStartValue: 0,
        scaleShowGridLines: true,
        scaleGridLineColor: "rgba(255,255,255,.1)"
      };

      function getKillData(d) { return d.kills.length; }

      function getSuicideData(d) { return d.suicides.length; }

      function updateChartSchema() {
        if (chartDataPlain != null) {
          $scope.chartData.labels = _.map(chartDataPlain, _.partial(stats.getBlockLabel, _, BAR_CHART_INTERVAL_SIZE));
          $scope.chartData.series = [$translate.instant("game.stats.kills"), $translate.instant("game.stats.suicides")];
          $scope.chartData.generators = [getKillData, getSuicideData];
        }
      }

      function updateChartEntries() {
        if (chartDataPlain != null) {
          var max = 0;
          $scope.chartData.data = _.map($scope.chartData.generators, function (generatorFn) {
            var list = _.map(chartDataPlain, generatorFn);
            max = _.max([max, _.max(list)]);
            return list;
          });
          var steps = 5;
          $scope.chartOptions.scaleSteps = steps;
          $scope.chartOptions.scaleStepWidth = Math.ceil(max / steps);
        }
      }

      stats.analyseDeaths(BAR_CHART_INTERVAL_SIZE).then(function (data) {
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
