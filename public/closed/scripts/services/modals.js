angular.module("closed").factory("modals", function ($uibModal) {
  "use strict";

  var Q_METHOD_REGEX = /^q[A-Z]/;

  /*==================================================== Exports  ====================================================*/

  var service = {
    joinGame: joinGame,
    suicide: suicide
  };

  qIfy(service);

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

  function suicide(game) {
    return $uibModal.open({
      templateUrl: "/templates/closed/modals/suicide.html",
      controller: "suicideCtrl",
      resolve: {
        game: _.constant(game)
      }
    });
  }

  function qIfy(obj) {
    _.each(_.keys(obj), function (key) {
      if (Q_METHOD_REGEX.test(key)) { return; }
      var value = obj[key];
      obj["q" + key[0].toUpperCase() + key.substring(1)] = function () { return value.apply(obj, arguments).result; };
    });
  }

  /*===================================================== Return =====================================================*/

  return service;
});
