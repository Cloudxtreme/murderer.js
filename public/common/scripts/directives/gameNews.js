angular.module("common").directive("gameNews", function () {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  return {
    restrict: "C",
    templateUrl: "/templates/common/game_news.html",
    controller: "newsCtrl"
  };
});
