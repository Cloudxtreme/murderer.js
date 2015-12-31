angular.module("closed").factory("modals", function ($uibModal) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  var service = {
    joinGame: joinGame
  };

  _.each(_.keys(service), function (key) {
    var value = service[key];
    service["q" + key[0].toUpperCase() + key.substring(1)] = function () {
      return value.apply(service, arguments).result;
    };
  });

  /*=================================================== Functions  ===================================================*/

  function joinGame(game) {
    return $uibModal.open({
      templateUrl: "/templates/closed/modals/join_game.html",
      controller: "joinGameCtrl",
      resolve: {
        game: _.constant(game)
      }
    });
  }

  /*===================================================== Return =====================================================*/

  return service;
});
