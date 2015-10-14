angular.module("admin").controller("gameDetailsCtrl", function ($scope, socket, gameId) {
  "use strict";

  $scope.game = null;
  $scope.users = null;

  socket.query("game:details", gameId).then(function (game) {
    $scope.game = game;
    $scope.users = {};
    _.each(game.participants, function (p) { $scope.users[p._id] = p; });
    _.each(game.rings, function (ring) {
      var ibu = ring.inactiveByUser = {};
      _.each(ring.inactive, function (i) {
        if (!ibu.hasOwnProperty(i.murderer)) {
          ibu[i.murderer] = [];
        }
        ibu[i.murderer].push(i);
      });
      _.each(ibu, function (list, key) {
        var item = list[0], current;
        for (var i = 1; i < list.length; i++) {
          current = list[i];
          if (current.nextVictim === item.victim) {
            item = current;
            i = 1;
          }
        }
        var sorted = [item];
        for (var j = 0; j < list.length; j++) {
          current = list[j];
          if (current.victim === item.nextVictim) {
            sorted.push(item = current);
            j = 0;
          }
        }
        ibu[key] = sorted;
      });
    });
  });
});
