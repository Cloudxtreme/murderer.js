angular.module("open").directive("register", function () {
  "use strict";

  return {
    restrict: "C",
    controller: "registerCtrl",
    scope: true
  };
});
