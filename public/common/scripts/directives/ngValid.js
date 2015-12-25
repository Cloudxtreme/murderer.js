angular.module("common").directive("ngValid", function () {
  "use strict";

  var DEFAULT_NAME = "bool";

  /*==================================================== Exports  ====================================================*/

  return {
    restrict: "A",
    require: "ngModel",
    scope: {
      data: "=ngValid"
    },
    link: link
  };

  /*=================================================== Functions  ===================================================*/

  /*------------------------------------------------------ Link ------------------------------------------------------*/

  function link($scope, ignored, attributes, controller) {
    var oldType = typeof $scope.data;
    var oldName = oldType === "object" ? [] : null;

    function validate() {
      var data = $scope.data;
      var type = typeof data;
      // check for type-change (for objects there may be multiple oldNames)
      if (type != oldType) {
        if (oldName instanceof Array) {
          _.each(oldName, function (key) { controller.$setValidity(key, null); });
        } else if (oldName != null) {
          controller.$setValidity(oldName, null);
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
            controller.$setValidity(oldName[i], null);
          }
          var val = typeof value === "function" ? value(attributes.ngModel) : value;
          controller.$setValidity(oldName[i] = key, !!val);
          i++;
        });
        if (i < oldName.length) {
          var j = i;
          for (; i < oldName.length; i++) {
            controller.$setValidity(oldName[i], null);
          }
          oldName.splice(j, oldName.length - j);
        }
      } else {
        if (oldName && oldName != DEFAULT_NAME) {
          controller.$setValidity(oldName, null);
        }
        //noinspection JSUnresolvedFunction
        var val = type === "function" ? data(attributes.ngModel) : data;
        controller.$setValidity(oldName = DEFAULT_NAME, !!val);
      }
    }

    $scope.$watch(attributes.ngModel, validate);
    $scope.$watch("data", validate);
  }

});
