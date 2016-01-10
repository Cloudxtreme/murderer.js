angular.module("admin").factory("adminModals", function ($rootScope, $uibModal) {
  "use strict";

  var Q_METHOD_REGEX = /^q[A-Z]/;

  /*==================================================== Exports  ====================================================*/

  var service = {
    markdownPreview: markdownPreview,
    createGame: createGame
  };

  qIfy(service);

  /*=================================================== Functions  ===================================================*/

  function markdownPreview(text) {
    return $uibModal.open({
      templateUrl: "/templates/admin/modals/markdown_preview.html",
      controller: "markdownPreviewCtrl",
      size: "lg",
      resolve: {plainText: _.constant(text)}
    });
  }

  function createGame() {
    return $uibModal.open({
      templateUrl: "/templates/admin/modals/create_game.html",
      controller: "createGameCtrl",
      size: "lg",
      backdrop: "static",
      keyboard: false
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
