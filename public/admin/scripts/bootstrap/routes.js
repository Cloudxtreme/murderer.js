angular.module("common").config(function ($routeProvider, $locationProvider) {
  "use strict";

  $locationProvider.html5Mode(true);

  // @ngInject
  $routeProvider
      .when("/acp", {
        templateUrl: "/views/admin/acp.html",
        controller: "acpCtrl"
      })
      .when("/game/:id", {
        templateUrl: "/views/admin/game_details.html",
        controller: "gameDetailsCtrl",
        resolve: {
          gameId: function ($route) { return $route.current.params.id; }
        }
      });

});
