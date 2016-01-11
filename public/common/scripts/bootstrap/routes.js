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
  $routeProvider
      .when("/games", {
        templateUrl: "/views/common/games.html",
        controller: "gamesCtrl" // to be implemented in extending modules
      })
      .when("/games/:gameId", {
        templateUrl: "/views/common/game.html",
        controller: "gameCtrl", // to be implemented in extending modules
        resolve: {gameId: function ($route) { return $route.current.params.gameId; }}
      })
  ;

  /*------------------------------------------------------ News ------------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/news", {
        templateUrl: "/views/common/news.html",
        controller: "newsCtrl" // to be implemented in extending modules
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
