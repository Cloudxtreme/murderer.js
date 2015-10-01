"use strict";

var users = require("../../../core/users/controller/users");

module.exports = function (queryRoute) {
  queryRoute("acp:users", function(data, cb) {
    users.find(this, data, cb);
  });
  queryRoute("acp:users.remove", function(data, cb) {
    users.removeById(this, data, cb);
    // TODO remove current connection(s) of user
  });
};
