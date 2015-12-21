/*
 * Events:
 *   * $rootScope - language.update - The locale in use has been updated.
 */
angular.module("common").run(function ($rootScope, $translate) {
  "use strict";

  /*===================================================== Scope  =====================================================*/

  $rootScope.language = null;

  $rootScope.setLanguage = function (language) { $translate.use(language); };

  /*------------------------------------------------- Scope Watcher  -------------------------------------------------*/

  $rootScope.$on("$translateChangeSuccess", refreshScope);

  /*=============================================== Initial Execution  ===============================================*/

  refreshScope();

  /*=================================================== Functions  ===================================================*/

  function refreshScope() {
    var language = $rootScope.language = $translate.use();
    moment.locale(language);
    $rootScope.$broadcast("language.update", language);
  }

});
