angular.module("closed").controller("gameCtrl", function ($rootScope, $scope, gameId, modals, games) {
  "use strict";
  // TODO move into common

  var MAX_NAMES_TITLE = 15;

  /*===================================================== Scope  =====================================================*/

  $scope.game = null;
  $scope.murders = null;

  $scope.loading = true;
  $scope.stateIcons = {
    stopped: "fa-stop text-danger",
    running: "fa-play text-success",
    paused: "fa-pause text-warning",
    initial: "fa-circle text-info"
  };

  $scope.join = join;
  $scope.leave = leave;
  $scope.suicide = suicide;
  $scope.news = $scope.score = $scope.table = $scope.stats = _.noop; // TODO implement
  $scope.showRingNews = $scope.showRingTable = _.noop; // TODO implement

  /*=============================================== Initial Execution  ===============================================*/

  loadGame();

  /*=================================================== Functions  ===================================================*/

  function loadGame() {
    $scope.loading = true;
    games
        .byId(gameId)
        .then(function (result) {
          $scope.game = prepareGame(result.game);
          $scope.murders = result.murders;
          $scope.loading = false;
        });
  }

  function prepareGame(game) {
    prepareGameSync(game);
    game.participating = false;
    game.state = game.ended ? "stopped" : game.active ? "running" : game.started ? "paused" : "initial";
    game.participating = _.any(game.groups, function (g) { return _.any(g.users, {user: $rootScope.identity._id}); });
    return game;
  }

  function join() { return modals.qJoinGame($scope.game).then(loadGame); } // TODO proper error handling

  function leave() { games.leave($scope.game).then(loadGame); } // TODO proper error handling

  function suicide() { modals.qSuicide($scope.game).then(loadGame); } // TODO proper error handling

  function prepareGameSync(game) {
    game.participants = _.sum(_.map(game.groups, function (g) {
      var userNames = _.pluck(g.users, "name");
      if (userNames.length > MAX_NAMES_TITLE) { userNames = _.take(userNames, MAX_NAMES_TITLE).concat(["..."]); }
      g.title = userNames.join(", ");
      return g.users.length;
    }));
    return game;
  }

});
