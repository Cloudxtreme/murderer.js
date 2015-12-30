angular.module("admin").controller("gamesCtrl", function ($q, $scope, adminModals, socket) {
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

  $scope.createGame = createGame; // TODO implement
  $scope.lockGame = startGame; // TODO implement
  $scope.startGame = startGame;
  $scope.resumeGame = startGame; // TODO implement
  $scope.pauseGame = startGame; // TODO implement
  $scope.stopGame = startGame; // TODO implement
  $scope.removeGame = startGame; // TODO implement

  /*=============================================== Initial Execution  ===============================================*/

  gamesInit = socket
      .query("games:all")
      .then(function (games) {
        Array.prototype.push.apply($scope.games, _.each(games, prepareGame));
        return $scope.games;
      });

  /*=================================================== Functions  ===================================================*/

  function createGame() {
    $q
        .all([gamesInit, adminModals.qNewGame()])
        .then(function (results) { results[0].unshift(prepareGame(results[1])); });
  }

  function prepareGame(game) {
    game.participants = _.sum(_.map(game.groups, function (g) { return g.users.length; }));
    return game;
  }

  function startGame(game) { // TODO handle result
    socket.query("game:start", game._id).then(function () { console.log(arguments); }, function () { console.error(arguments); });
  }

  function sortStateValue(game) { return game.ended ? 3 : game.active ? 2 : game.started ? 1 : 0; }

});
