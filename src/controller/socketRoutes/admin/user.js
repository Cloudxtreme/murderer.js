"use strict";

var userC = require("../../../core/user/controller/user");

module.exports = function (queryRoute) {
  queryRoute("users:all", function(data, cb) {
    userC.find(this, data, cb);
  });
  queryRoute("user:remove", function(data, cb) {
    userC.removeById(this, data, cb);
    // TODO remove current connection(s) of user
  });
};
