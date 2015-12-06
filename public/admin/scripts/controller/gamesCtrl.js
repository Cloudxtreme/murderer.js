angular.module("admin").controller("gamesCtrl", function ($scope, $timeout, socket) {
  "use strict";

  $scope.games = null;

  $scope.newGame = {
    name: null,
    rings: 3
  };

  var gamesInit = socket.query("games:all").then(function (games) { return $scope.games = games; });

  $scope.createGame = function () {
    socket.query("users:all").then(function (users) {
      var game = _.extend({participants: _.pluck(_.filter(users, function (user) { return !user.admin; }), "_id")}, $scope.newGame);
      socket.query("game:create", game).then(function (game) {
        game.new = true;
        gamesInit.then(function (games) {
          games.push(game);
          $timeout(function () { delete game.new; }, 2000);
          return games;
        });
      });
    });
  };

  $scope.toggleActive = function (game) {
    socket.query("game:update", _.extend(_.pick(game, ["_id"]), {active: !game.active})).then(_.partial(_.merge, game));
  };

});