angular.module("common").config(function ($routeProvider, $locationProvider) {
  "use strict";

  $locationProvider.html5Mode(true);

  // @ngInject
  $routeProvider
      .when("/game", {
        templateUrl: "/views/closed/game.html",
        controller: "gameCtrl"
      })
      .when("/contract", {
        templateUrl: "/views/closed/contract.html",
        controller: "contractCtrl"
      });

});
