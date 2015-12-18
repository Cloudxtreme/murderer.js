"use strict";

var Q = require("q");

var userC = require.main.require("./core/user/controller");

module.exports = function (queryRoute) {
  queryRoute("exists:username", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad Request."); } // TODO via socket-route-validator TBI
    return userC.qExistsUsername(this, data);
  });

  queryRoute("exists:email", function (data) {
    if (typeof data !== "string") { return Q.reject("Bad Request."); } // TODO via socket-route-validator TBI
    return userC.qExistsEmail(this, data);
  });
};
