angular.module("common").run(function ($rootScope, CONFIG) {
  "use strict";
  $rootScope.config = CONFIG;
});
