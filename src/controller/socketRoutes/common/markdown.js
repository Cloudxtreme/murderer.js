"use strict";

var Q = require("q");
var marked = require("marked");

module.exports = function (queryRoute) {
  queryRoute("markdown:parse", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad Argument."); }
    return Q.resolve(marked(data));
  });
};
