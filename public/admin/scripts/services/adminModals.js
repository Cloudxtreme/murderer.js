angular.module("admin").factory("adminModals", function ($rootScope, $uibModal) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  var service = {
    markdownPreview: markdownPreview
  };

  _.each(_.keys(service), function (key) {
    var value = service[key];
    service["q" + key[0].toUpperCase() + key.substring(1)] = function () {
      return value.apply(service, arguments).result;
    };
  });

  /*=================================================== Functions  ===================================================*/

  function markdownPreview(text) {
    return $uibModal.open({
      templateUrl: "/templates/admin/modals/markdown_preview.html",
      controller: "markdownPreviewCtrl",
      size: "lg",
      resolve: {plainText: _.constant(text)}
    });
  }

  /*===================================================== Return =====================================================*/

  return service;
});
