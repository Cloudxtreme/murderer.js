angular.module("admin").controller("gamesCtrl", function ($q, $scope, adminModals, games) {
  "use strict";

  var gamesInit;

  /*===================================================== Scope  =====================================================*/

  $scope.groups = null;
  $scope.groupsList = null;

  $scope.games = [];
  $scope.displayedGames = [];
  $scope.sort = {
    state: sortStateValue
  };

  $scope.createGame = createGame;
  $scope.lockGame = function (game) { games.lock(game).then(function (g) { _.extend(game, g); }); };
  $scope.startGame = function (game) { games.start(game).then(function (g) { _.extend(game, g); }); };
  $scope.resumeGame = function (game) { games.resume(game).then(function (g) { _.extend(game, g); }); };
  $scope.pauseGame = function (game) { games.pause(game).then(function (g) { _.extend(game, g); }); };
  $scope.stopGame = function (game) { games.stop(game).then(function (g) { _.extend(game, g); }); };
  $scope.removeGame = removeGame;

  /*=============================================== Initial Execution  ===============================================*/

  gamesInit = games.all()
      .then(function (games) {
        Array.prototype.push.apply($scope.games, _.each(games, prepareGame));
        return $scope.games;
      });

  /*=================================================== Functions  ===================================================*/

  function prepareGame(game) {
    game.participants = _.sum(_.map(game.groups, function (g) { return g.users.length; }));
    return game;
  }

  function createGame() {
    $q
        .all([gamesInit, adminModals.qNewGame()])
        .then(function (results) { results[0].unshift(prepareGame(results[1])); });
  }

  function removeGame(game) {
    games
        .remove(game)
        .then(function () { $scope.games.splice(_.indexOf($scope.games, game), 1); });
  }

  function sortStateValue(game) { return game.ended ? 3 : game.active ? 2 : game.started ? 1 : 0; }

});
