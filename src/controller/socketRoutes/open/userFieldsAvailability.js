"use strict";

var users = require("../../../core/users/controller/users");

module.exports = function (queryRoute) {
  queryRoute("username:available", function (data, cb) {
    users.existsUsername(this, data, cb);
  });
};
