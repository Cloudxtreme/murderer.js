"use strict";

var murderC = require.main.require("./core/murder/controller");

module.exports = function (queryRoute) {
  queryRoute("murder:all", function () { return murderC.qNews(this); });
};
