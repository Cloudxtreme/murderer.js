angular.module("common").controller("newsCtrl", function ($q, $scope, $rootScope, $translate, socket) {
  "use strict";

  /*=================================================== Show news  ===================================================*/

  var LIMIT_GAME_NEWS = 10;

  $q
      .all([
        socket.query("news:global"),
        socket.query("news:game", LIMIT_GAME_NEWS)
      ])
      .then(function (data) {
        var sticky = data[0].concat(data[1].special);
        // uncomment for styling
        //sticky.push({server: true, entryDate: new Date().toISOString(), message: "Server shutdown in 20min."});
        //sticky.push({server: false, entryDate: new Date().toISOString(), author: {_id: "test-ID", username: "Asterisk"}, message: "Game 'ProjectAI' will end in 45min."});
        var sorted = _.sortByOrder(sticky, ["entryDate"], ["desc"]).concat(data[1].kills);
        $scope.news = _.map(sorted, function (n) {
          return {
            type: n.server != null ? (n.author ? "ADMIN" : "SERVER") : (n.murderer != null ? "KILL" : "SUICIDE"),
            date: n.entryDate,
            data: n
          };
        });
      }, function (err) { console.error(err); });

  /*================================================ Show statistics  ================================================*/

  // TODO move statistics is separated directive and do calculation stuff within service

  var INTERVAL_HOURS = 6;
  var chartDataPlain = null;

  $scope.news = null;
  $scope.barChartData = {};
  $scope.barChartOptions = {
    scaleOverride: true,
    tooltipFillColor: "rgba(255,255,255,0.1)",
    scaleStartValue: 0,
    scaleShowGridLines: true,
    scaleGridLineColor: "rgba(255,255,255,.1)"
  };
  $scope.barChartColors = ["#F7464A", "#97BBCD", "#46BFBD", "#FDB45C", "#949FB1", "#4D5360", "#DCDCDC"];

  function getBlockMoment(kill) {
    var m = moment(kill.entryDate).millisecond(0).second(0).minute(0);
    m.hour((Math.ceil(m.hour() / INTERVAL_HOURS)) * INTERVAL_HOURS);
    return m;
  }

  function getBlockLabel(data) {
    var from = getBlockMoment({entryDate: moment(data.date).subtract(INTERVAL_HOURS, "h")}).format("dd HH:00");
    var to = data.date.format("dd HH:00");
    return from + " - " + to;
  }

  function fillDates(list) {
    if (list.length) {
      var date = list[0].date;
      for (var i = 1; i < list.length; i++) {
        date = getBlockMoment({entryDate: moment(date).add(INTERVAL_HOURS, "h")});
        if (+date < +list[i].date) {
          list.splice(i, 0, {date: date, kills: [], suicides: []});
        }
      }
    }
  }

  socket.query("news:game.deaths").then(function (data) {
    var byDate = {};
    _.each(data.kills, function (kill) {
      var date = getBlockMoment(kill), iso = date.toISOString();
      if (!byDate.hasOwnProperty(iso)) {
        byDate[iso] = {date: date, kills: [kill], suicides: []};
      } else {
        byDate[iso].kills.push(kill);
      }
    });
    _.each(data.suicides, function (suicide) {
      var date = getBlockMoment(suicide), iso = date.toISOString();
      if (!byDate.hasOwnProperty(iso)) {
        byDate[iso] = {date: date, kills: [], suicides: [suicide]};
      } else {
        byDate[iso].suicides.push(suicide);
      }
    });
    // uncomment for styling
    //var date = getBlockMoment({entryDate: moment().add(INTERVAL_HOURS, "h")});
    //byDate[date.toISOString()] = {date: date, kills: _.times(5, null), suicides: _.times(1, null)};
    //date = getBlockMoment({entryDate: moment().add(INTERVAL_HOURS * 4, "h")});
    //byDate[date.toISOString()] = {date: date, kills: _.times(13, null), suicides: _.times(2, null)};
    //date = getBlockMoment({entryDate: moment().add(5, "d")});
    //byDate[date.toISOString()] = {date: date, kills: _.times(13, null), suicides: _.times(2, null)};
    chartDataPlain = _.sortBy(_.values(byDate), "date");
    fillDates(chartDataPlain);
    updateChartSchema();
    updateChartEntries();
  });

  var getKillData = function (d) { return d.kills.length; };
  var getSuicideData = function (d) { return d.suicides.length; };

  function updateChartSchema() {
    if (chartDataPlain != null) {
      $scope.barChartData.labels = _.map(chartDataPlain, getBlockLabel);
      $scope.barChartData.series = [
        $translate.instant("game.stats.kills"),
        $translate.instant("game.stats.suicides")
      ];
      $scope.barChartData.generators = [
          getKillData,
          getSuicideData
      ];
    }
  }

  function updateChartEntries() {
    if (chartDataPlain != null) {
      var max = 0;
      $scope.barChartData.data = _.map($scope.barChartData.generators, function (generatorFn) {
        var list = _.map(chartDataPlain, generatorFn);
        max = _.max([max, _.max(list)]);
        return list;
      });
      var steps = 5;
      $scope.barChartOptions.scaleSteps = steps;
      $scope.barChartOptions.scaleStepWidth = Math.ceil(max / steps);
    }
  }

  $rootScope.$on("language.update", updateChartSchema);

});
