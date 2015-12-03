angular.module("admin").config(function ($routeProvider, $locationProvider) {
  "use strict";

  $locationProvider.html5Mode(true);

  // @ngInject
  $routeProvider
      .when("/acp", {
        templateUrl: "/views/admin/acp/main.html"
      })
      .when("/acp/games", {
        templateUrl: "/views/admin/acp/games.html",
        controller: "gamesCtrl"
      })
      .when("/game/:id", {
        templateUrl: "/views/admin/game_details.html",
        controller: "gameDetailsCtrl",
        resolve: {
          gameId: function ($route) { return $route.current.params.id; }
        }
      })
      .when("/game/:id/contracts", {
        templateUrl: "/views/admin/contracts.html",
        controller: "gameContractsCtrl",
        resolve: {
          gameId: function ($route) { return $route.current.params.id; }
        }
      });

});
