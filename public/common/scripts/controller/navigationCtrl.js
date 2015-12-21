angular.module("common").controller("navigationCtrl", function ($scope, $location) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.checkRoute = checkRoute;
  $scope.checkRoutePrefix = checkRoutePrefix;

  /*=================================================== Functions  ===================================================*/

  function checkRoute(value, url) {
    if (url == null) { url = $location.url(); }
    if (value instanceof Array) { return _.any(value, checkRoute, url); }
    return url === value;
  }

  function checkRoutePrefix(value, url) {
    if (url == null) { url = $location.url(); }
    if (value instanceof Array) { return _.any(value, checkRoutePrefix, url); }
    return url === value || url.startsWith(value + "/");
  }

});
