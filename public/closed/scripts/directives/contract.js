angular.module("closed").directive("contract", function () {
  "use strict";

  return {
    restrict: "A",
    scope: {
      contract: "=contract",
      murderer: "="
    },
    templateUrl: "/templates/closed/contract.html"
  };
});
