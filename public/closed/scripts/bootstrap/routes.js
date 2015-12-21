angular.module("common").config(function ($routeProvider) {
  "use strict";

  /*===================================================== Routes =====================================================*/

  /*----------------------------------------------------- Games  -----------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/game", {
        templateUrl: "/views/closed/game.html",
        controller: "gameCtrl"
      })

      .when("/contracts", {
        templateUrl: "/views/closed/contracts.html",
        controller: "contractsCtrl"
      })
  ;

});
