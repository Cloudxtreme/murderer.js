angular.module("common").directive("breadcrumb", function () {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  return {
    restrict: "C",
    templateUrl: "/templates/common/breadcrumb.html",
    controller: "breadcrumbCtrl"
  };
});
