angular.module("common").config(function ($routeProvider, $locationProvider) {
  "use strict";

  /*================================================= HTML5 Routing  =================================================*/

  $locationProvider.html5Mode(true);

  /*===================================================== Routes =====================================================*/

  /*------------------------------------------------------ Home ------------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/", {
        templateUrl: "/views/common/home.html"
      })
  ;

  /*----------------------------------------------- Legal Information  -----------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/cookie-policy", {
        templateUrl: "/views/cookiePolicy.html"
      })

      .when("/privacy-policy", {
        templateUrl: "/views/privacyPolicy.html"
      })

      .when("/legal-info", {
        templateUrl: "/views/legalInfo.html"
      })
  ;

  /*----------------------------------------------------- Games  -----------------------------------------------------*/

  // @ngInject
  //$routeProvider
  //    .when("/game", {
  //      templateUrl: "/views/common/game.html"
  //    })
  //
  //    .when("/statistics", {
  //      templateUrl: "/views/common/stats.html",
  //      resolve: {cacheInvalidation: function (stats) { stats.clearCache(); }}
  //    })
  //;

  /*-------------------------------------------------- Error Pages  --------------------------------------------------*/

  // @ngInject
  $routeProvider
      .otherwise({
        templateUrl: "/views/common/404.html"
      })
  ;

});
