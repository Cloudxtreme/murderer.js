angular.module("closed").directive("contract", function () {
  "use strict";

  return {
    restrict: "A",
    scope: {
      contract: "=",
      murderer: "=",
      game: "="
    },
    templateUrl: "/templates/closed/contract.html",
    link: function ($scope, $elem) { $elem.addClass("contract"); }
  };
});
