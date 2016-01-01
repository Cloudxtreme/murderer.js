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

      .when("/contracts", {
        templateUrl: "/views/closed/contracts.html",
        controller: "contractsCtrl"
      })
  ;

});
