angular.module("open").directive("login", function () {
  "use strict";

  return {
    restrict: "C",
    controller: "loginCtrl",
    scope: true
  };
});
