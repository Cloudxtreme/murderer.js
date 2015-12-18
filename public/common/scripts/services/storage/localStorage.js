angular.module("common").factory("localStorage", function ($window, cookieStorage, cookiesAccepted) {
  "use strict";

  var localStorage = $window.localStorage;

  return localStorage != null ? {
    supported: true,

    get: function () { return localStorage.getItem.apply(localStorage, arguments); },
    getObject: function () {
      try {
        return JSON.parse(localStorage.getItem.apply(localStorage, arguments));
      } catch (e) {
        return void 0;
      }
    },
    getAll: function () { return localStorage; },

    put: cookiesAccepted.delay(function (key, value) { return localStorage.setItem(key, value); }),
    putObject: cookiesAccepted.delay(function (key, value) {
      return localStorage.setItem(key, JSON.stringify(value));
    }),

    remove: function () { return localStorage.removeItem.apply(localStorage, arguments); }
  } : cookieStorage;
});
