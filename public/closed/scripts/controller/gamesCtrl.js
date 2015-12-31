angular.module("closed").controller("gamesCtrl", function ($scope, modals, games) {
  "use strict";

  var joinedPromise;

  /*===================================================== Scope  =====================================================*/

  $scope.loading = true;
  $scope.games = [];
  $scope.sort = {
    state: sortStateValue,
    participants: sortParticipantsValue
  };

  $scope.joinGame = joinGame;
  $scope.leaveGame = leaveGame;

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
    var promise = joinedPromise.then(function (games) { game.joined = _.contains(games, game._id); });
    if (game.started) {
      game.mayJoin = game.mayLeave = false;
    } else {
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

});
