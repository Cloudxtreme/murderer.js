angular.module("common").controller("newsCtrl", function ( $scope, news) {
  "use strict";

  $scope.news = news.list;

  news.getAll().catch(console.error);

});
