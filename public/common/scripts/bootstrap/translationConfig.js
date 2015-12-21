angular.module("common").config(function ($translateProvider) {
  "use strict";
  // this is not default implementation, gets customized for delaying until cookies accepted by user
  // see common/scripts/services/storage/$translateLocalStorage.js
  $translateProvider.useLocalStorage();
});
