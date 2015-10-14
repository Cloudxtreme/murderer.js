angular.module("admin").filter("math", function () {
  "use strict";

  return function (value, method) { return Math[method](value); };
});
