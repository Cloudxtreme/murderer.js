angular.module("common").factory("localStorage", function ($window, cookieStorage, cookiesAccepted) {
  "use strict";

  var localStorage = $window.localStorage;

  /*==================================================== Exports  ====================================================*/

  var service;

  if (localStorage == null || typeof localStorage.getItem !== "function") {

    /*---------------------------------------- Export cookie storage fallback ----------------------------------------*/

    service = cookieStorage;

  } else {

    /*----------------------------------------- Export local storage methods -----------------------------------------*/

    service = {
      get: getItem,
      getObject: getItemJSON,
      getAll: function () { return localStorage; },
      put: cookiesAccepted.delay(setItem),
      putObject: cookiesAccepted.delay(setItemJSON),
      remove: removeItem
    };

  }

  return service;

  /*=================================================== Functions  ===================================================*/

  function getItem() { return localStorage.getItem.apply(localStorage, arguments); }

  function getItemJSON() {
    try {
      return JSON.parse(localStorage.getItem.apply(localStorage, arguments));
    } catch (e) {
      return void 0;
    }
  }

  function removeItem() { return localStorage.removeItem.apply(localStorage, arguments); }

  function setItem(key, value) { return localStorage.setItem(key, value); }

  function setItemJSON(key, value) { return localStorage.setItem(key, JSON.stringify(value)); }

});
