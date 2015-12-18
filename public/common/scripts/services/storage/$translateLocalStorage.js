angular.module("common").factory("$translateLocalStorage", $translateLocalStorage);

function $translateLocalStorage(localStorage) {
  "use strict";

  var langKey;

  return {
    get: function (name) { return langKey || (langKey = localStorage.get(name)); },
    put: function (name, value) {
      langKey = value;
      localStorage.put(name, value);
    }
  };
}

$translateLocalStorage.displayName = "$translateLocalStorageFactory";
