angular.module("open").config(function ($routeProvider) {
  "use strict";

  /*===================================================== Routes =====================================================*/

  /*----------------------------------------------------- Login  -----------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/login", {
        templateUrl: "/views/open/login.html"
      })
  ;

});
