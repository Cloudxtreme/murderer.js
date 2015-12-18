angular.module("common").factory("cookieStorage", function ($cookies, cookiesAccepted) {
  "use strict";

  var service = {};

  _.each(["get", "getObject", "getAll", "remove"], function (key) {
    service[key] = function () { return $cookies[key].apply($cookies, arguments); };
  });

  _.each(["put", "putObject"], function (key) {
    service[key] = cookiesAccepted.delay(function () { return $cookies[key].apply($cookies, arguments); });
  });

  return service;
});
