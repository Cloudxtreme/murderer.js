angular.module("common").factory("cookiesAccepted", function ($cookies, $q) {
  "use strict";

  var defer = $q.defer();

  var service = {
    promise: defer.promise,

    init: function () {
      var value = +$cookies.get("cookiesAccepted") > 0 ? true : null;
      if (value === true) { defer.resolve(); }
      return value;
    },
    accept: function (expire) {
      $cookies.put("cookiesAccepted", Date.now(), {expires: expire});
      defer.resolve();
    },
    reject: function () { defer.reject(); },

    delay: function (cb) {
      return function () {
        var args = arguments;
        service.promise.then(function () { cb.apply(null, args); });
      };
    }
  };

  return service;
});
