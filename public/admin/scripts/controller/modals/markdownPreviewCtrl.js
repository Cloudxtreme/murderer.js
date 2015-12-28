angular.module("admin").controller("markdownPreviewCtrl", function ($scope, plainText, socket) {
  "use strict";

  $scope.loading = true;

  socket
      .query("markdown:parse", plainText)
      .then(function (parsed) {
        $scope.parsedMarkdown = parsed;
        $scope.loading = false;
      }, function (err) {
        console.error(err);
        $scope.loading = false;
      });

});
