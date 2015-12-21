angular.module("admin").controller("gamesCtrl", function ($scope, $timeout, socket) {
  "use strict";

  var gameGroups = [];

  $scope.games = null;
  $scope.newGame = {
    name: null,
    groups: gameGroups
  };

  var gamesInit = socket.query("games:all").then(function (games) { return $scope.games = games; });

  $scope.createGame = function () {
    socket.query("game:create", $scope.newGame).then(function (game) {
      game.new = true;
      gamesInit.then(function (games) {
        games.push(game);
        $timeout(function () { delete game.new; }, 2000);
        return games;
      });
    });
  };

  $scope.toggleActive = function (game) {
    socket.query("game:update", _.extend(_.pick(game, ["_id"]), {active: !game.active})).then(_.partial(_.merge, game));
  };

  $scope.containsGroup = function (group) { return _.any($scope.newGame.groups, {group: group._id}); };

  $scope.addGroup = function (group) { gameGroups.push({group: group._id}); };
  $scope.removeGroup = function (index) { gameGroups.splice(index, 1); };
  $scope.moveDown = function (index) { gameGroups.splice(index, 2, gameGroups[index + 1], gameGroups[index]); };
  $scope.moveUp = function (index) { $scope.moveDown(index - 1); };

  socket.query("groups:all").then(function (groups) {
    var g = $scope.groups = {};
    $scope.groupsList = _.each(groups, function (group) { g[group._id] = group; });
  });

});