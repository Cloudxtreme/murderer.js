angular.module("closed").filter("html", function ($sce) {
  "use strict";

  return function (html) { return $sce.trustAsHtml(html); };
});
