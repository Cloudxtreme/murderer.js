angular.module("open").config(function ($routeProvider) {
  "use strict";

  // @ngInject
  $routeProvider
      .when("/login", {
        templateUrl: "/views/open/login.html",
        controller: "loginCtrl"
      })
      .when("/register", {
        templateUrl: "/views/open/register.html",
        controller: "registerCtrl"
      });

});
