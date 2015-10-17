angular.module("common").controller("newsCtrl", function ($q, $scope, $rootScope, $translate, socket) {
  "use strict";

  var LIMIT_GAME_NEWS = 10;

  $scope.news = null;

  $q
      .all([
        socket.query("news:global"),
        socket.query("news:game", LIMIT_GAME_NEWS)
      ])
      .then(function (data) {
        var sticky = data[0].concat(data[1].special);
        // uncomment for styling
        //sticky.push({server: true, entryDate: new Date().toISOString(), message: "Server shutdown in 20min."});
        //sticky.push({server: false, entryDate: new Date().toISOString(), author: {_id: "test-ID", username: "Asterisk"}, message: "Game 'ProjectAI' will end in 45min."});
        var sorted = _.sortByOrder(sticky, ["entryDate"], ["desc"]).concat(data[1].kills);
        $scope.news = _.map(sorted, function (n) {
          return {
            type: n.server != null ? (n.author ? "ADMIN" : "SERVER") : (n.murderer != null ? "KILL" : "SUICIDE"),
            date: n.entryDate,
            data: n
          };
        });
      }, function (err) { console.error(err); });

});
