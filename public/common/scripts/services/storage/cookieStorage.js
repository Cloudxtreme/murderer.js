angular.module("common").factory("cookieStorage", function ($cookies, cookiesAccepted) {
  "use strict";

  /*==================================================== Exports  ====================================================*/

  var service = {};

  /*------------------------------------------- Extend exports of $cookies -------------------------------------------*/

  _.each(["get", "getObject", "getAll", "remove"], extend);
  _.each(["put", "putObject"], extendDelayed);

  return service;

  /*=================================================== Functions  ===================================================*/

  function extend(key) {
    service[key] = function () { return $cookies[key].apply($cookies, arguments); };
  }

  function extendDelayed(key) {
    service[key] = cookiesAccepted.delay(function () { return $cookies[key].apply($cookies, arguments); });
  }

});
