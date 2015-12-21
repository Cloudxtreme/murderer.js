angular.module("common").factory("cookiesAccepted", function ($cookies, $q) {
  "use strict";

  var defer = $q.defer();

  /*==================================================== Exports  ====================================================*/

  var service = {
    promise: defer.promise,

    init: init,
    accept: accept,
    reject: function () { defer.reject(); },
    delay: delay
  };

  return service;

  /*=================================================== Functions  ===================================================*/

  function accept(expire) {
    $cookies.put("cookiesAccepted", Date.now() + "", {expires: expire});
    defer.resolve();
  }

  function delay(cb) {
    return function () {
      var args = arguments;
      service.promise.then(function () { cb.apply(null, args); });
    };
  }

  function init() {
    var value = +$cookies.get("cookiesAccepted") > 0 ? true : null;
    if (value === true) { defer.resolve(); }
    return value;
  }

});
