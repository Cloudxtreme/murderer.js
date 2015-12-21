angular.module("common").factory("$translateLocalStorage", function (localStorage) {
  "use strict";

  var langKey;

  /*==================================================== Exports  ====================================================*/

  return {
    get: get,
    put: put
  };

  /*=================================================== Functions  ===================================================*/

  function get(name) { return langKey || (langKey = localStorage.get(name)); }

  function put(name, value) {
    langKey = value;
    localStorage.put(name, value);
  }

});
