angular.module("admin").directive("breadcrumb", function ($rootScope, $location, $translate) {
  "use strict";

  var listener = [];

  function callListeners() { _.each(listener, function (fn) { fn(); }); }

  $rootScope.$on("language.update", callListeners);

  return {
    restrict: "C",
    templateUrl: "/templates/admin/breadcrumb.html",
    link: function ($scope) {
      $scope.items = [];

      function add(link, part, translations) {
        var scope = {part: part, link: link};
        var text;
        var t = _.find(translations, function (translate) {
          text = $translate.instant(translate, scope);
          return text !== translate;
        });
        if (t == null || !text) {
          text = part[0].toUpperCase() + part.substring(1);
        }
        $scope.items.push({text: text, link: link});
      }

      function update() {
        $scope.items.splice(0, $scope.items.length);
        var path = $location.path();
        /**
         * @type [String]
         * Holds all possible (straight and via wildcards) translation-keys for the current part within each iteration.
         * It's ordered to always prefer straight translations over wildcards.
         */
        var translations = ["breadcrumb"];
        var link = "";
        add("/", "home", translations);
        if (path !== "/") {
          var parts = path.substring(1).split("/");
          _.each(parts, function (part) {
            link += "/" + part;
            translations = _.flatten(_.map(translations, function (t) {
              var straight = t + "/." + part;
              var wildcard = t + "/.*";
              var wc = $translate.instant(wildcard);
              if (wc !== wildcard) {
                return [straight, wildcard];
              }
              return straight;
            }));
            add(link, part, translations);
          });
        }
        $scope.items[$scope.items.length - 1].link = false;
      }

      update();
      listener.push(update);
      $scope.$on("$destroy", function () { listener.splice(_.indexOf(listener, update), 1); });
    }
  };
});
