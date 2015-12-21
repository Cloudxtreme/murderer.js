angular.module("common").controller("newsCtrl", function ( $scope, news) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.news = news.list;

  /*=============================================== Initial Execution  ===============================================*/

  news.getAll();

});
