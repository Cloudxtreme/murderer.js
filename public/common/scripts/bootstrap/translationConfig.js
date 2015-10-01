angular.module("common").config(function ($translateProvider) {
  "use strict";

  $translateProvider.useLocalStorage();
});

angular.module("common").run(function ($rootScope, $translate) {
  "use strict";

  $rootScope.setLanguage = function (language) { $translate.use(language); };
  $rootScope.$on("$translateChangeSucces", function () { $rootScope.language = $translate.use(); });
});
