"use strict";

var userC = require("../../../core/user/controller/user");

module.exports = function (queryRoute) {
  queryRoute("username:available", function (data, cb) {
    userC.existsUsername(this, data, cb);
  });
};
