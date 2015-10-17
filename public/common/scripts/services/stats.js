angular.module("common").factory("stats", function (socket) {
  "use strict";

  function getBlockMoment(kill, hoursEachBlock) {
    var m = moment(kill.entryDate).millisecond(0).second(0).minute(0);
    m.hour((Math.ceil(m.hour() / hoursEachBlock)) * hoursEachBlock);
    return m;
  }

  function fillDates(list, hoursEachBlock) {
    if (list.length) {
      var date = list[0].date;
      for (var i = 1; i < list.length; i++) {
        date = getBlockMoment({entryDate: moment(date).add(hoursEachBlock, "h")}, hoursEachBlock);
        if (+date < +list[i].date) {
          list.splice(i, 0, {date: date, kills: [], suicides: []});
        }
      }
    }
  }

  var service = {
    analyseDeaths: function (hoursEachBlock) {
      return socket.query("news:game.deaths").then(function (data) {
        var byDate = {};
        _.each(data.kills, function (kill) {
          var date = getBlockMoment(kill, hoursEachBlock), iso = date.toISOString();
          if (!byDate.hasOwnProperty(iso)) {
            byDate[iso] = {date: date, kills: [kill], suicides: []};
          } else {
            byDate[iso].kills.push(kill);
          }
        });
        _.each(data.suicides, function (suicide) {
          var date = getBlockMoment(suicide, hoursEachBlock), iso = date.toISOString();
          if (!byDate.hasOwnProperty(iso)) {
            byDate[iso] = {date: date, kills: [], suicides: [suicide]};
          } else {
            byDate[iso].suicides.push(suicide);
          }
        });
        // uncomment for styling
        //var date = getBlockMoment({entryDate: moment().add(INTERVAL_HOURS, "h")}, hoursEachBlock);
        //byDate[date.toISOString()] = {date: date, kills: _.times(5, null), suicides: _.times(1, null)};
        //date = getBlockMoment({entryDate: moment().add(INTERVAL_HOURS * 4, "h")}, hoursEachBlock);
        //byDate[date.toISOString()] = {date: date, kills: _.times(13, null), suicides: _.times(2, null)};
        //date = getBlockMoment({entryDate: moment().add(5, "d")}, hoursEachBlock);
        //byDate[date.toISOString()] = {date: date, kills: _.times(13, null), suicides: _.times(2, null)};
        var result = _.sortBy(_.values(byDate), "date");
        fillDates(result, hoursEachBlock);
        return result;
      });
    },

    getBlockLabel: function (data, hoursEachBlock) {
      var from = getBlockMoment({entryDate: moment(data.date).subtract(hoursEachBlock, "h")}, hoursEachBlock).format("dd HH:00");
      var to = data.date.format("dd HH:00");
      return from + " - " + to;
    }
  };

  return service;
});
