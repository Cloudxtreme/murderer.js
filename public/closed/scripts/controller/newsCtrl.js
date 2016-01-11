angular.module("closed").controller("newsCtrl", function ($scope, news, closedNews) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $scope.news = news.list;
  $scope.toggleUpVote = closedNews.toggleUpVote;
  // TODO add pagination
  // TODO add filter by game

  /*=============================================== Initial Execution  ===============================================*/

  news.getAll().then(function (entries) { return _.each(entries, closedNews.prepareNews); });

});
