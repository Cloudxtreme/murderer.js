angular.module("common").run(function (localStorage) {
  "use strict";
  // socket.io creates an annoying debug cookie
  localStorage.remove("debug");
});
