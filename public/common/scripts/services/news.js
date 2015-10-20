angular.module("common").factory("news", function ($q, $timeout, socket) {
  "use strict";

  var LIMIT_GAME_NEWS = 10;

  var initPromise = null;

  function getEntry(entry) {
    return {
      type: entry.server != null ? (entry.author ? "ADMIN" : "SERVER") : (entry.murderer != null ? "KILL" : "SUICIDE"),
      date: entry.entryDate,
      data: entry
    };
  }

  function getStickyEntry(entry) {
    var e = getEntry(entry);
    e.sticky = true;
    return e;
  }

  function insertInOrder(list, entry) {
    var current;
    for (var i = 0; i < list.length; i++) {
      current = list[i];
      if (entry.sticky && !current.sticky || entry.sticky === current.sticky && entry.date >= current.date) {
        break;
      }
    }
    console.log(list, i, entry);
    list.splice(i, 0, entry);
  }

  var service = {
    list: [],

    getAll: function () {
      if (initPromise == null) {
        initPromise = $q
            .all([
              socket.query("news:global"),
              socket.query("news:game", LIMIT_GAME_NEWS)
            ])
            .then(function (data) {
              var sticky = data[0].concat(data[1].special);
              // uncomment for styling
              //sticky.push({server: true, entryDate: new Date().toISOString(), message: "Server shutdown in 20min."});
              //sticky.push({server: false, entryDate: new Date().toISOString(), author: {_id: "test-ID", username: "Asterisk"}, message: "Game 'ProjectAI' will end in 45min."});
              var list = _.sortByOrder(_.map(sticky, getStickyEntry), ["date"], ["desc"])
                  .concat(_.sortByOrder(_.map(data[1].kills, getEntry), ["date"], ["desc"]));
              Array.prototype.splice.apply(service.list, [0, service.list.length].concat(list));
              return service.list;
            });
      }
      return initPromise;
    }
  };

  socket.on("news:update.game", function (track) {
    service.getAll().then(_.partial(insertInOrder, _, getEntry(track)));
  });

  socket.on("news:update.global", function (track) {
    service.getAll().then(_.partial(insertInOrder, _, getStickyEntry(track)));
  });

  return service;
});
