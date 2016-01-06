angular.module("closed").controller("gamesCtrl", function ($scope, modals, games) {
  "use strict";
  // TODO move into common
  // TODO move functionality into service

  var joinedPromise;

  /*===================================================== Scope  =====================================================*/

  $scope.loading = true;
  $scope.games = [];
  $scope.sort = {
    state: sortStateValue,
    participants: sortParticipantsValue
  };
  $scope.stateIcons = {
    stopped: "fa-stop text-danger",
    running: "fa-play text-success",
    paused: "fa-pause text-warning",
    initial: "fa-circle text-info"
  };

  $scope.joinGame = joinGame;
  $scope.leaveGame = leaveGame;
  $scope.suicide = suicide;

  /*=============================================== Initial Execution  ===============================================*/

  games.all()
      .then(function (games) {
        Array.prototype.push.apply($scope.games, _.each(games, prepareGame));
        $scope.loading = false;
        return $scope.games;
      }); // TODO proper error handling

  joinedPromise = games.joined();

  /*=================================================== Functions  ===================================================*/

  function sortStateValue(game) { return game.ended ? 3 : game.active ? 2 : game.started ? 1 : 0; }

  function sortParticipantsValue(game) { // first without limit sorted by participants, later with limit sorted by free slots
    return game.limit.participants ? game.limit.participants - game.participants : Number.MIN_VALUE + game.participants;
  }

  function prepareGame(game) {
    prepareGameSync(game);
    game.state = game.ended ? "stopped" : game.active ? "running" : game.started ? "paused" : "initial";
    var promise = joinedPromise.then(function (games) {
      game.joined = _.contains(games, game._id);
      game.maySuicide = game.joined && game.started; // TODO check iff alive and not alone in any ring
    });
    if (game.started) {
      game.mayJoin = game.mayLeave = false;
      game.maySuicide = game.joined; // TODO check iff alive and not alone in any ring
    } else {
      game.maySuicide = false;
      promise.then(function () { game.mayJoin = !(game.mayLeave = game.joined); });
    }
    return game;
  }

  function prepareGameSync(game) {
    game.participants = _.sum(_.map(game.groups, function (g) { return g.users.length; }));
    return game;
  }

  function joinGame(game) {
    return modals.qJoinGame(game).then(function (g) {
      prepareGameSync(_.extend(game, g));
      game.mayJoin = false;
      game.mayLeave = game.joined = true;
    });
  }

  function leaveGame(game) {
    games.leave(game).then(function (g) {
      prepareGameSync(_.extend(game, g));
      game.mayJoin = true;
      game.mayLeave = game.joined = false;
    }); // TODO proper error handling
  }

  function suicide(game) {
    modals.qSuicide(game).then(function (g) {
      prepareGameSync(_.extend(game, g));
      game.maySuicide = false;
    });
  }

});
