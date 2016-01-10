angular.module("common").config(function ($routeProvider) {
  "use strict";

  /*===================================================== Routes =====================================================*/

  /*----------------------------------------------------- Games  -----------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/contracts", {
        templateUrl: "/views/closed/contracts.html",
        controller: "contractsCtrl"
      })
  ;

});
