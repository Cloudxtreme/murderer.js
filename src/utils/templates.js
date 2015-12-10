"use strict";

var _ = require("lodash");

module.exports = function (string, data) {
  if (typeof string !== "string") { return ""; }
  if (data == null) { return string; }

  var check = function (val, key) {
    if (typeof val === "function") {
      string = string.replace(new RegExp("<%\\s*" + key + "(\\([^)]*\\))\\s*%>", "gi"), val);
    } else {
      string = string.replace(new RegExp("<%\\s*" + key + "\\s*%>", "gi"), val);
      if (typeof val === "object") {
        _.each(val, function (v, k) { check(v, key + "." + k); });
      }
    }
  };

  _.each(data, check);

  return string;
};
