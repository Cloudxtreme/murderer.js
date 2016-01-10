angular.module("closed").controller("gameCtrl", function ($scope, gameId, games, closedGames) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.game = null;
  $scope.murders = null;

  $scope.loading = true;
  $scope.stateIcon = games.stateIcon;

  $scope.news = $scope.score = $scope.table = $scope.stats = _.noop; // TODO implement
  $scope.showRingNews = $scope.showRingTable = _.noop; // TODO implement

  $scope.join = function () { closedGames.join($scope.game); };
  $scope.leave = function () { closedGames.leave($scope.game); };
  $scope.suicide = function () { closedGames.suicide($scope.game); };

  /*=============================================== Initial Execution  ===============================================*/

  refreshGame();

  /*=================================================== Functions  ===================================================*/

  function refreshGame() {
    $scope.loading = true;
    games
        .byId(gameId)
        .then(function (result) {
          $scope.game = games.prepareGameSingleView(result.game);
          $scope.murders = result.murders;
          $scope.loading = false;
        });
  }

});
