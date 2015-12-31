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

      //.when("/acp/games/:id", {
      //  templateUrl: "/views/admin/game/details.html",
      //  controller: "gameDetailsCtrl",
      //  resolve: {
      //    gameId: function ($route) { return $route.current.params.id; }
      //  }
      //})
      //.when("/acp/games/:id/contracts", {
      //  templateUrl: "/views/admin/game/contracts.html",
      //  controller: "gameContractsCtrl",
      //  resolve: {
      //    gameId: function ($route) { return $route.current.params.id; }
      //  }
      //})

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
