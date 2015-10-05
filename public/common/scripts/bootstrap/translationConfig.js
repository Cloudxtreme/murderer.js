angular.module("common").config(function ($translateProvider) {
  "use strict";

  $translateProvider.useLocalStorage();
});

angular.module("common").run(function ($rootScope, $translate) {
  "use strict";

  function refreshScope() { $rootScope.language = $translate.use(); }

  $rootScope.setLanguage = function (language) { $translate.use(language); };
  $rootScope.$on("$translateChangeSuccess", refreshScope);

  refreshScope();
});
