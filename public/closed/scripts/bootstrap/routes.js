angular.module("common").config(function ($routeProvider) {
  "use strict";

  /*===================================================== Routes =====================================================*/

  /*----------------------------------------------------- Games  -----------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/games", {
        templateUrl: "/views/closed/games.html",
        controller: "gamesCtrl"
      })
      .when("/games/:gameId", {
        templateUrl: "/views/closed/game.html",
        controller: "gameCtrl",
        resolve: {gameId: function ($route) { return $route.current.params.gameId; }}
      })

      .when("/contracts", {
        templateUrl: "/views/closed/contracts.html",
        controller: "contractsCtrl"
      })
  ;

});
