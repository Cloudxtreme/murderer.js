angular.module("common").directive("ngValid", function () {
  "use strict";
  var DEFAULT_NAME = "bool";

  return {
    restrict: "A",
    require: "ngModel",
    scope: {
      data: "=ngValid"
    },
    link: function ($scope, $elem, attr, c) {
      var oldType = typeof $scope.data;
      var oldName = oldType === "object" ? [] : null;

      function validate() {
        var data = $scope.data;
        var type = typeof data;
        // check for type-change (for objects there may be multiple oldNames)
        if (type != oldType) {
          if (oldName instanceof Array) {
            _.each(oldName, function (key) { c.$setValidity(key, null); });
          } else if (oldName != null) {
            c.$setValidity(oldName, null);
          }
          oldType = type;
          oldName = oldType === "object" ? [] : null;
        }

        if (type === "object") {
          if (data == null) {
            data = {};
            data[DEFAULT_NAME] = false;
          }
          var i = 0;
          _.each(data, function (value, key) {
            if (oldName[i] && oldName[i] != key) {
              c.$setValidity(oldName[i], null);
            }
            var val = typeof value === "function" ? value(attr.ngModel) : value;
            c.$setValidity(oldName[i] = key, !!val);
            i++;
          });
          if (i < oldName.length) {
            var j = i;
            for (; i < oldName.length; i++) {
              c.$setValidity(oldName[i], null);
            }
            oldName.splice(j, oldName.length - j);
          }
        } else {
          if (oldName && oldName != DEFAULT_NAME) {
            c.$setValidity(oldName, null);
          }
          var val = type === "function" ? data(attr.ngModel) : data;
          c.$setValidity(oldName = DEFAULT_NAME, !!val);
        }
      }

      $scope.$watch(attr.ngModel, validate);
      $scope.$watch("data", validate);
    }
  };
});
