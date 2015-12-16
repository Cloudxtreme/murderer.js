angular.module("common").config(function ($routeProvider, $locationProvider) {
  "use strict";

  $locationProvider.html5Mode(true);

  // @ngInject
  $routeProvider
      .when("/", {
        templateUrl: "/views/common/home.html"
      })

      .when("/cookie-policy", {
        templateUrl: "/views/common/cookiePolicy.html"
      })
      .when("/privacy-policy", {
        templateUrl: "/views/common/privacyPolicy.html"
      })
      .when("/legal-info", {
        templateUrl: "/views/common/legalInfo.html"
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
