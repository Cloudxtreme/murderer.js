"use strict";

var _ = require("lodash");

var GROUPS = _.sortBy([
  {name: "Zsh", tutors: "Asterix, Kolja, Ole"},
  {name: "C++", tutors: "Kevin, Stefan"},
  {name: "Lisp", tutors: "Maxi, Lennart"},
  {name: "Python", tutors: "Tobi, Thomas"},
  {name: "Haskell", tutors: "Marc, Hauke"},
  {name: "Rust", tutors: "Christian, Christian"},
  {name: "COBOL", tutors: "Laura"},
  {name: "Java", tutors: "Simon, Jannes"},
  {name: "Fortran", tutors: "Nils, Torsten"}
], "name").concat([
  {name: "No group"}
]);

module.exports = function (queryRoute) {
  queryRoute("groups:get", function (data, cb) { cb(null, GROUPS); });
};

module.exports.GROUPS = GROUPS;
