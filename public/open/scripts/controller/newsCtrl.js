angular.module("open").controller("newsCtrl", function ($scope, news) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.news = news.list;
  // TODO add pagination
  // TODO add filter by game

  /*=============================================== Initial Execution  ===============================================*/

  news.getAll();

});
