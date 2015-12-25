angular.module("common").directive("moment", function ($rootScope, $translate) {
  "use strict";

  var bodyTarget = {}; // just some new object for identity-checks

  /*==================================================== Exports  ====================================================*/

  return {
    restrict: "A",
    scope: {
      value: "=moment",
      target: "@momentTarget",
      placeholder: "@momentPlaceholder",
      format: "@momentFormat"
    },
    link: link
  };

  /*=================================================== Functions  ===================================================*/

  function fillTarget($element, target, value) {
    if (target === bodyTarget) {
      $element.text(value == null ? "" : value);
    } else if (target) {
      if (value == null) {
        $element.removeAttr(target);
      } else {
        $element.attr(target, value);
      }
    }
  }

  function update($scope, $element) {
    var value = moment($scope.value || null);
    fillTarget(
        $element,
        $scope.target || bodyTarget,
        value.isValid() ?
            value.format($scope.format || "lll") :
            $scope.placeholder ?
                $translate.instant("moment.placeholder." + $scope.placeholder) :
                ""
    );
  }

  /*------------------------------------------------------ Link ------------------------------------------------------*/

  function link($scope, $element) {
    var destroyCb = $rootScope.$on("language.update", function () { update($scope, $element); });

    $scope.$watch("target", function (newTarget, oldTarget) {
      if (oldTarget != null) { fillTarget($element, oldTarget, null); }
      update($scope, $element);
    });

    $scope.$watchGroup(["placeholder", "format", "value"], function () { update($scope, $element); });

    $scope.$on("$destroy", destroyCb);
  }

});
