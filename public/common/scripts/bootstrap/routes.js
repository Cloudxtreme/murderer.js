angular.module("common").config(function ($routeProvider, $locationProvider) {
  "use strict";

  $locationProvider.html5Mode(true);

  // @ngInject
  $routeProvider
      .when("/", {
        templateUrl: "/views/common/home.html"
      })
      .when("/game", {
        templateUrl: "/views/common/game.html"
      })
      .otherwise({
        templateUrl: "/views/common/404.html"
      });

});
