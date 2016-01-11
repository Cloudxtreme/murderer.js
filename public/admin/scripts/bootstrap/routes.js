angular.module("admin").config(function ($routeProvider) {
  "use strict";

  /*===================================================== Routes =====================================================*/

  /*------------------------------------------------------ ACP  ------------------------------------------------------*/

  // @ngInject
  $routeProvider
      .when("/acp", {
        templateUrl: "/views/admin/acp.html"
      })

      .when("/acp/games", {
        templateUrl: "/views/admin/games.html",
        controller: "adminGamesCtrl"
      })

      .when("/acp/groups", {
        templateUrl: "/views/admin/groups.html",
        controller: "groupsCtrl"
      })

      .when("/acp/users", {
        templateUrl: "/views/admin/users.html",
        controller: "usersCtrl"
      })
  ;

});
