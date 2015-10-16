angular.module("closed").directive("moment", function ($rootScope, $translate) {
  "use strict";

  var bodyTarget = {};
  var watching = [];

  function fillTarget(elem, target, value) {
    if (target === bodyTarget) {
      elem.text(value == null ? "" : value);
    } else if (target) {
      if (value == null) {
        elem.removeAttr(target);
      } else {
        elem.attr(target, value);
      }
    }
  }

  function update(scope, elem) {
    var value = moment(scope.value || null);
    if (value.isValid()) {
      fillTarget(elem, scope.target || bodyTarget, value.format(scope.format || "lll"));
    } else {
      fillTarget(elem, scope.target || bodyTarget, scope.placeholder ? $translate.instant("moment.placeholder." + scope.placeholder) : "");
    }
  }

  $rootScope.$on("language.update", function () {
    _.each(watching, function (w) { update(w.scope, w.element); });
  });

  return {
    restrict: "A",
    scope: {
      value: "=moment",
      target: "@momentTarget",
      placeholder: "@momentPlaceholder",
      format: "@momentFormat"
    },
    link: function ($scope, $elem) {
      var watch = {scope: $scope, element: $elem};
      watching.push(watch);

      $scope.$watch("target", function (newTarget, oldTarget) {
        if (oldTarget != null) {
          fillTarget($elem, oldTarget, null);
        }
        update($scope, $elem);
      });

      $scope.$watchGroup(["placeholder", "format", "value"], function () { update($scope, $elem); });

      // lastIndexOf since it's more probable that elements added later are removed earlier (performance increase)
      $scope.$on("$destroy", function () { watching.splice(_.lastIndexOf(watching, watch), 1); });
    }
  };
});
