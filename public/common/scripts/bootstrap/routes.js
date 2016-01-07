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

  /*------------------------------------------------------ News ------------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/news", {
        templateUrl: "/views/common/news.html",
        controller: "newsCtrl"
      })
  ;

  /*-------------------------------------------------- Error Pages  --------------------------------------------------*/

  // @ngInject
  $routeProvider
      .otherwise({
        templateUrl: "/views/common/404.html"
      })
  ;

});
