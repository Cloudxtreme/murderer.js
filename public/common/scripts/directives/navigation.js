angular.module("common").directive("navigation", function () {
  "use strict";
  return {
    restrict: "C",
    scope: true,
    controller: "navigationCtrl"
  };
});
