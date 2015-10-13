angular.module("common").config(function ($routeProvider, $locationProvider) {
  "use strict";

  $locationProvider.html5Mode(true);

  // @ngInject
  $routeProvider
      .when("/acp", {
        templateUrl: "/views/admin/acp.html",
        controller: "acpCtrl"
      });

});
