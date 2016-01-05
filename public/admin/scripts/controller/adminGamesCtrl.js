angular.module("admin").controller("adminGamesCtrl", function ($scope, adminModals, adminGames) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.groups = null;
  $scope.groupsList = null;

  $scope.games = [];
  $scope.displayedGames = [];
  $scope.stateIcons = {
    stopped: "fa-stop text-danger",
    running: "fa-play text-success",
    paused: "fa-pause text-warning",
    initial: "fa-circle text-info"
  };
  $scope.sort = {
    state: sortStateValue
  };

  $scope.createGame = createGame;
  $scope.lockGame = function (game) { adminGames.lock(game).then(function (g) { _.extend(game, g); }); };
  $scope.startGame = function (game) { adminGames.start(game).then(function (g) { _.extend(game, g); }); };
  $scope.resumeGame = function (game) { adminGames.resume(game).then(function (g) { _.extend(game, g); }); };
  $scope.pauseGame = function (game) { adminGames.pause(game).then(function (g) { _.extend(game, g); }); };
  $scope.stopGame = function (game) { adminGames.stop(game).then(function (g) { _.extend(game, g); }); };
  $scope.removeGame = removeGame;

  /*=============================================== Initial Execution  ===============================================*/

  adminGames.all()
      .then(function (games) {
        Array.prototype.push.apply($scope.games, _.each(games, prepareGame));
        return $scope.games;
      });

  /*=================================================== Functions  ===================================================*/

  function prepareGame(game) {
    game.participants = _.sum(_.map(game.groups, function (g) { return g.users.length; }));
    game.state = game.ended ? "stopped" : game.active ? "running" : game.started ? "paused" : "initial";
    return game;
  }

  function createGame() { adminModals.qNewGame().then(function (game) { $scope.games.unshift(prepareGame(game)); }); }

  function removeGame(game) {
    adminGames
        .remove(game)
        .then(function () { $scope.games.splice(_.indexOf($scope.games, game), 1); });
  }

  function sortStateValue(game) { return game.ended ? 3 : game.active ? 2 : game.started ? 1 : 0; }

});
