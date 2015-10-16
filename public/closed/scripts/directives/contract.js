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
    link: function ($scope, $elem) {
      $elem.addClass("contract");
      // TODO add end-date to game instance and automatically end it on server-side
      $scope.endDate = moment("22.10.2015 14:00", "DD.MM.YYYY hh:mm").toDate();
    }
  };
});
