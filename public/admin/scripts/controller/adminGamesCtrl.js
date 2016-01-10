angular.module("admin").controller("adminGamesCtrl", function ($scope, games, adminGames) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.groups = null;
  $scope.groupsList = null;

  $scope.games = [];
  $scope.displayedGames = [];
  $scope.stateIcon = games.stateIcon;

  $scope.sort = {
    state: games.sortValue.state
  };
  $scope.createGame = createGame;
  $scope.lockGame = lockGame;
  $scope.startGame = startGame;
  $scope.resumeGame = resumeGame;
  $scope.pauseGame = pauseGame;
  $scope.stopGame = stopGame;
  $scope.removeGame = removeGame;

  /*=============================================== Initial Execution  ===============================================*/

  adminGames.all()
      .then(function (games) {
        Array.prototype.push.apply($scope.games, _.each(games, adminGames.prepareGameListView));
        return $scope.games;
      });

  /*=================================================== Functions  ===================================================*/

  function lockGame(game) {
    adminGames.lock(game).then(function (g) { adminGames.prepareGameListView(_.extend(game, g)); });
  }

  function startGame(game) {
    adminGames.start(game).then(function (g) { adminGames.prepareGameListView(_.extend(game, g)); });
  }

  function resumeGame(game) {
    adminGames.resume(game).then(function (g) { adminGames.prepareGameListView(_.extend(game, g)); });
  }

  function pauseGame(game) {
    adminGames.pause(game).then(function (g) { adminGames.prepareGameListView(_.extend(game, g)); });
  }

  function stopGame(game) {
    adminGames.stop(game).then(function (g) { adminGames.prepareGameListView(_.extend(game, g)); });
  }

  function createGame() {
    adminGames.create().then(function (g) { $scope.games.unshift(adminGames.prepareGameListView(g)); });
  }

  function removeGame(game) {
    adminGames.remove(game).then(function () { $scope.games.splice(_.indexOf($scope.games, game), 1); });
  }

});
