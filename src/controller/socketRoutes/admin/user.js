"use strict";

var userC = require("../../../core/user/controller/user");

module.exports = function (queryRoute) {
  var projection = {username: 1, admin: 1, email: 1};

  queryRoute("users:activated", function (data, cb) { userC.find(this, {activated: true}, projection, cb); });

  queryRoute("users:not-activated", function (data, cb) { userC.find(this, {activated: false}, projection, cb); });

  queryRoute("user:remove", function (data, cb) {
    userC.removeById(this, data, cb);
    // TODO remove current connection(s) of user
  });

  queryRoute("user:update", function (data, cb) {
    userC.findByIdAndUpdate(this, {_id: data._id}, data, cb);
    // TODO remove current connection(s) of user to enforce re-acquisition of module-permissions
  });
};
