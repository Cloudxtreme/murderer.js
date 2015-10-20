angular.module("common").factory("stats", function ($q, socket) {
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
    deathsCache: null,
    usersCache: null,

    clearCache: function () { service.deathsCache = service.usersCache = null; },

    getBlockLabel: function (data, hoursEachBlock) {
      var from = getBlockMoment({entryDate: moment(data.date).subtract(hoursEachBlock, "h")}, hoursEachBlock).format("dd HH:00");
      var to = data.date.format("dd HH:00");
      return from + " - " + to;
    },

    analyseDeaths: function (hoursEachBlock) {
      var promise = service.deathsCache = service.deathsCache || socket.query("stats:game.deaths");
      return promise.then(function (data) {
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

    analyseUsers: function () {
      if (service.usersCache) {
        return service.usersCache;
      }
      return service.usersCache = socket.query("stats:game.users").then(function (data) {
        data.usersByLives = _.times(data.rings + 1, _.constant(0));
        _.each(data.users, function (user) {
          user.total = {active: 0, kills: 0};
          _.each(user.active, function (val) {
            if (val) {
              user.total.active++;
            }
          });
          data.usersByLives[user.total.active]++;
          _.each(user.kills, function (ring) { user.total.kills += ring.length; });
        });
        data.rings = _.times(data.rings, function (idx) {
          var ring = {active: 0};
          _.each(data.users, function (user) {
            if (user.active[idx] === true) {
              ring.active++;
            }
          });
          return ring;
        });
        return data;
      });
    },

    analyseTotal: function (hoursEachBlock) {
      return $q.all([
        service.analyseUsers().then(function (data) {
          return _.sum(data.rings, function (ring) { return ring.active <= 1 ? 0 : ring.active; });
        }),
        service.analyseDeaths(hoursEachBlock).then(function (data) {
          return _.sum(_.pluck(data, "kills"), function (arr) { return arr.length; });
        })
      ]).then(function (data) {
        return {
          active: data[0],
          kills: data[1]
        };
      });
    }
  };

  return service;
});
