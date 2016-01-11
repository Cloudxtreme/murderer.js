angular.module("common").factory("news", function (socket) {
  "use strict";

  var ICONS = {
    suicide: "fa-bomb",
    kill: "fa-spoon"
  };

  var fetchAllPromise = null;

  /*==================================================== Exports  ====================================================*/

  var service = {
    list: [],
    games: {},

    getAll: function () { return fetchAllPromise = fetchAllPromise || fetchAll(); }
  };

  /*------------------------------------------------- Socket watcher -------------------------------------------------*/

  //socket.on("news:update.game", updateGameNews);
  //socket.on("news:update.global", updateGlobalNews);

  /*----------------------------------------------------- Return -----------------------------------------------------*/

  return service;

  /*=================================================== Functions  ===================================================*/

  function fetchAll() {
    return socket
        .query("murder:all")
        .then(function (result) {
          _.each(result.games, function (game) { service.games[game._id] = game; });
          _.each(result.murders, prepareMurder);
          Array.prototype.splice.apply(service.list, [0, service.list.length].concat(result.murders));
          return service.list;
        });
  }

  function prepareMurder(murder) {
    murder.isMurder = true;
    murder.game = service.games[murder.game];
    if (murder.ring != null) { murder.ringIdx = _.indexOf(murder.game.rings, murder.ring); }
    murder.victim = findUserData(murder.game, murder.victim);
    murder.murderer = findUserData(murder.game, murder.murderer);
    murder.suicide = murder.victim == null;
    murder.type = murder.suicide ? "suicide" : "kill";
    murder.icon = ICONS[murder.type];
    return murder;
  }

  function findUserData(game, userId) {
    if (userId == null) { return userId; }
    var userData = null;
    _.any(game.groups, function (groupData) {
      return _.any(groupData.users, function (uD) { if (uD.user === userId) { return userData = uD; } });
    });
    return userData;
  }

});
