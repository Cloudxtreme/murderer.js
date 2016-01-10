angular.module("common").factory("games", function (socket) {
  "use strict";

  var NAMES_TITLE_MAX = 48, NAMES_TITLE_BREAK = 8;

  var joinedCachePromise;

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    stateIcon: {
      stopped: "fa-stop text-danger",
      running: "fa-play text-success",
      paused: "fa-pause text-warning",
      initial: "fa-circle text-info"
    },

    sortValue: {
      state: sortStateValue,
      participants: sortParticipantsValue
    },

    all: function () { return socket.query("games:all"); },
    byId: function (gameId) { return socket.query("game:details", gameId); },
    joined: getJoined,

    addGroupTitles: addGroupTitles,
    prepareGameSingleView: prepareGameSingleView,
    prepareGameListView: prepareGameListView
  };

  /*=================================================== Functions  ===================================================*/

  function groupArray(array, perGroup) {
    var newArr = [];
    while (array.length > 0) { newArr.push(array.splice(0, perGroup)); }
    return newArr;
  }

  function doubleJoin(groupedArray, sep0, sep1) {
    if (!groupedArray.length) { return ""; }
    var str = "", current, _len = groupedArray.length - 1, i, j;
    for (i = 0; i < _len; i++) {
      current = groupedArray[i];
      for (j = 0; j < current.length; j++) { str += current[j] + sep1; }
      str += sep0;
    }
    current = groupedArray[_len];
    if (!current.length) { return str; }
    _len = current.length - 1;
    for (j = 0; j < _len; j++) { str += current[j] + sep1; }
    return str + current[_len];
  }

  function getJoined() {
    if (joinedCachePromise != null) { return joinedCachePromise; }
    return joinedCachePromise = socket.promises.identified.then(function (identity) {
      return identity.guest ? [] : socket.query("games:joined");
    });
  }

  function prepareGameSingleView(game) { return prepareGameListView(addGroupTitles(game)); }

  function addGroupTitles(game) {
    _.each(game.groups, function (g) {
      var userNames = _.pluck(g.users, "name");
      if (userNames.length > NAMES_TITLE_MAX) { userNames = _.take(userNames, NAMES_TITLE_MAX).concat(["..."]); }
      g.title = doubleJoin(groupArray(userNames, NAMES_TITLE_BREAK), "\n", ", ");
    });
    return game;
  }

  function prepareGameListView(game) {
    game.participants = _.sum(_.map(game.groups, function (g) { return g.users.length; }));
    game.state = game.ended ? "stopped" : game.active ? "running" : game.started ? "paused" : "initial";
    var promise = getJoined().then(function (games) { game.joined = _.contains(games, game._id); });
    if (game.started) {
      game.mayJoin = game.mayLeave = false;
      game.maySuicide = game.isAlive;
    } else {
      game.maySuicide = false;
      promise.then(function () { game.mayJoin = !(game.mayLeave = game.joined) && !socket.identity.guest; });
    }
    return game;
  }

  function sortStateValue(game) { return game.ended ? 3 : game.active ? 2 : game.started ? 1 : 0; }

  function sortParticipantsValue(game) {
    // first without limit sorted by participants, later with limit sorted by free slots
    return game.limit.participants ? game.limit.participants - game.participants : Number.MIN_VALUE + game.participants;
  }

  /*===================================================== Return =====================================================*/

  return service;
});
