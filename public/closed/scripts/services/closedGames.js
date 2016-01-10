angular.module("closed").factory("closedGames", function (socket, modals, games) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  //noinspection UnnecessaryLocalVariableJS
  var service = {
    join: join,
    leave: leave,
    suicide: suicide,
    kill: kill
  };

  /*=================================================== Functions  ===================================================*/

  function kill(game, ringId, ringIdx) { // TODO indicate processing status, prevent concurrent attempts
    return modals
        .qKill(game, ringIdx)
        .then(function (data) {
          return socket.query("murder:token", _.extend(data, {gameId: game._id, ringId: ringId}));
        });
  }

  function join(game) { // TODO indicate processing status, prevent concurrent requests
    return modals
        .qJoinGame(game)
        .then(function (data) { return socket.query("game:join", _.extend(data, {gameId: game._id})); })
        .then(function (groups) {
          updateGameParticipation(game, groups);
          games.joined().then(function (gameIds) { gameIds.push(game._id); });
          game.mayJoin = false;
          game.joined = game.mayLeave = true;
          return game;
        }); // TODO proper error handling
  }

  function leave(game) { // TODO indicate processing status, prevent concurrent requests
    return socket
        .query("game:leave", game._id)
        .then(function (groups) {
          updateGameParticipation(game, groups);
          games.joined().then(function (gameIds) {
            var idx = _.indexOf(gameIds, game._id);
            if (~idx) { gameIds.splice(idx, 1); }
          });
          game.mayJoin = true;
          game.joined = game.mayLeave = false;
          return game;
        }); // TODO proper error handling
  }

  function suicide(game) { // TODO indicate processing status, prevent concurrent requests
    return modals
        .qSuicide(game)
        .then(function (data) { return socket.query("murder:self", _.extend(data, {gameId: game._id})); })
        .then(function () { game.maySuicide = game.isAlive = false; }); // TODO proper error handling
  }

  function updateGameParticipation(game, groups) {
    game.participants = _.sum(_.map(game.groups = groups, function (g) { return g.users.length; }));
    games.addGroupTitles(game);
  }

  /*===================================================== Return =====================================================*/

  return service;
});
