angular.module("common").controller("breadcrumbCtrl", function ($scope, $rootScope, $location, $translate) {
  "use strict";

  var destroyCbs = [
    $rootScope.$on("language.update", refreshItems),
    $rootScope.$on("$routeChangeSuccess", refreshItems)
  ];

  /*===================================================== Scope  =====================================================*/

  $scope.items = [];

  /*------------------------------------------------- Scope Watcher  -------------------------------------------------*/

  // unbind event-listener from $rootScope when $scope gets destroyed.
  $scope.$on("$destroy", function () { _.each(destroyCbs, _.callback); });

  /*=============================================== Initial Execution  ===============================================*/

  refreshItems();

  /*=================================================== Functions  ===================================================*/

  function addItem(link, part, translations) {
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

  function refreshItems() {
    $scope.items.splice(0, $scope.items.length);
    var path = $location.path();
    /**
     * @type [String]
     * Holds all possible (straight and via wildcards) translation-keys for the current part within each iteration.
     * It's ordered to always prefer straight translations over wildcards.
     */
    var translations = ["breadcrumb"];
    var link = "";
    addItem("/", "home", translations);
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
        addItem(link, part, translations);
      });
    }
    $scope.items[$scope.items.length - 1].link = false;
  }

});
