angular.module("closed").controller("gamesCtrl", function ($scope, games, closedGames) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.loading = true;
  $scope.games = [];
  $scope.stateIcon = games.stateIcon;

  $scope.sort = {
    state: games.sortValue.state,
    participants: games.sortValue.participants
  };
  $scope.join = function (game) { closedGames.join(game); };
  $scope.leave = function (game) { closedGames.leave(game); };
  $scope.suicide = function (game) { closedGames.suicide(game); };

  /*=============================================== Initial Execution  ===============================================*/

  games
      .all()
      .then(function (gameArray) {
        Array.prototype.push.apply($scope.games, _.each(gameArray, games.prepareGameListView));
        $scope.loading = false;
      }); // TODO proper error handling

});
