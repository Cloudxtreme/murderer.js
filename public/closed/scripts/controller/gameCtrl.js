angular.module("closed").controller("gameCtrl", function ($rootScope, $scope, gameId, games) {
  "use strict";
  // TODO move into common

  var MAX_NAMES_TITLE = 15;

  /*===================================================== Scope  =====================================================*/

  $scope.game = null;
  $scope.murders = null;

  $scope.loading = true;

  $scope.suicide = $scope.join = $scope.leave = _.noop; // TODO implement
  $scope.news = $scope.score = $scope.table = $scope.stats = _.noop; // TODO implement
  $scope.showRingNews = $scope.showRingTable = _.noop; // TODO implement

  /*=============================================== Initial Execution  ===============================================*/

  games
      .byId(gameId)
      .then(function (result) {
        $scope.game = prepareGame(result.game);
        $scope.murders = result.murders;
        $scope.loading = false;
      });

  /*=================================================== Functions  ===================================================*/

  function prepareGame(game) {
    game.participants = 0;
    game.participating = false;
    game.statusIcon = "text-" +
        (game.ended ? "danger fa-stop" :
            game.active ? "success fa-play" :
                game.started ? "warning fa-pause" :
                    "info fa-circle");
    _.each(game.groups, function (groupData) {
      game.participants += groupData.users.length;
      game.participating = game.participating || _.any(groupData.users, {user: $rootScope.identity._id});
      var userNames = _.pluck(groupData.users, "name");
      if (userNames.length > MAX_NAMES_TITLE) { userNames = _.take(userNames, MAX_NAMES_TITLE).concat(["..."]); }
      groupData.title = userNames.join(", ");
    });
    console.log(game);
    return game;
  }

});
