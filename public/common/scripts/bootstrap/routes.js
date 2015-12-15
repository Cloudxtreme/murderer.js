angular.module("common").config(function ($routeProvider, $locationProvider) {
  "use strict";

  $locationProvider.html5Mode(true);

  // @ngInject
  $routeProvider
      .when("/", {
        templateUrl: "/views/common/home.html"
      })

      .when("/terms", {
        templateUrl: "/views/common/terms.html"
      })
      .when("/policy", {
        templateUrl: "/views/common/privacypolicy.html"
      })
      .when("/disclaimer", {
        templateUrl: "/views/common/disclaimer.html"
      })

      .when("/game", {
        templateUrl: "/views/common/game.html"
      })

      .when("/statistics", {
        templateUrl: "/views/common/stats.html",
        resolve: {cacheInvalidation: function (stats) { stats.clearCache(); }}
      })

      .otherwise({
        templateUrl: "/views/common/404.html"
      });

});
