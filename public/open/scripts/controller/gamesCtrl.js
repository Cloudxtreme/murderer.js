angular.module("open").controller("gamesCtrl", function ($scope, games) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.loading = true;
  $scope.games = [];
  $scope.stateIcon = games.stateIcon;

  $scope.sort = {
    state: games.sortValue.state,
    participants: games.sortValue.participants
  };

  /*=============================================== Initial Execution  ===============================================*/

  games
      .all()
      .then(function (gameArray) {
        Array.prototype.push.apply($scope.games, _.each(gameArray, games.prepareGameListView));
        $scope.loading = false;
      }); // TODO proper error handling

});
