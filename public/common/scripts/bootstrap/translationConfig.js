angular.module("common").config(function ($translateProvider) {
  "use strict";

  $translateProvider.useLocalStorage();
});

angular.module("common").run(function ($rootScope, $translate) {
  "use strict";

  function refreshScope() {
    var language = $rootScope.language = $translate.use();
    moment.locale(language);
    $rootScope.$broadcast("language.update", language);
  }

  $rootScope.setLanguage = function (language) { $translate.use(language); };
  $rootScope.$on("$translateChangeSuccess", refreshScope);

  refreshScope();
});
