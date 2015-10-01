"use strict";

var _ = require("lodash");

module.exports = function (string, data) {
  if (typeof string !== "string") {
    return "";
  }
  _.each(data, function (val, key) {
    if (typeof val === "function") {
      string = string.replace(new RegExp("<%\\s*" + key + "(\\([^)]*\\))\\s*%>", "gi"), val);
    } else {
      string = string.replace(new RegExp("<%\\s*" + key + "\\s*%>", "gi"), val);
    }
  });
  return string;
};
