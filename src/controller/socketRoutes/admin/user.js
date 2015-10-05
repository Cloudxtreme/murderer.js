"use strict";

var userC = require("../../../core/user/controller/user");

module.exports = function (queryRoute) {
  queryRoute("acp:user", function(data, cb) {
    userC.find(this, data, cb);
  });
  queryRoute("acp:user.remove", function(data, cb) {
    userC.removeById(this, data, cb);
    // TODO remove current connection(s) of user
  });
};
