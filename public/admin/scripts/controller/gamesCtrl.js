angular.module("admin").controller("gamesCtrl", function ($scope, $timeout, adminModals, socket) {
  "use strict";

  var gamesInit;

  /*===================================================== Scope  =====================================================*/

  $scope.games = null;
  $scope.groups = null;
  $scope.groupsList = null;

  $scope.newGame = {name: null, groups: []};

  $scope.createGame = createGame;
  $scope.containsGroup = function (arr, group) { return _.any($scope.newGame.groups, {group: group._id}); };
  $scope.addGroup = function (arr, group) { arr.push({group: group._id}); };
  $scope.remove = function (arr, index) { arr.splice(index, 1); };
  $scope.moveDown = function (arr, index) { arr.splice(index, 2, arr[index + 1], arr[index]); };
  $scope.moveUp = function (arr, index) { $scope.moveDown(arr, index - 1); };
  $scope.markdownModal = adminModals.markdownPreview;

  /*=============================================== Initial Execution  ===============================================*/

  /*------------------------------------------------ Fetch all games  ------------------------------------------------*/

  gamesInit = socket
      .query("games:all")
      .then(function (games) { return $scope.games = games; });

  /*------------------------------------------------ Fetch all groups ------------------------------------------------*/

  socket
      .query("groups:all")
      .then(function (groups) {
        var g = $scope.groups = {}; // apply map of groups by id to scope
        $scope.groupsList = _.each(groups, function (group) { g[group._id] = group; });
      });

  /*=================================================== Functions  ===================================================*/

  function createGame() {
    socket.query("game:create", $scope.newGame).then(function (game) {
      gamesInit.then(function (games) {
        games.push(game);
        return games;
      });
    });
  }

});