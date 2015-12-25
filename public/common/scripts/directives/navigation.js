angular.module("common").directive("navigation", function () {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  return {
    restrict: "C",
    scope: true,
    controller: "navigationCtrl"
  };
});
