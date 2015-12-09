"use strict";

var userC = require.main.require("./core/user/controller");

module.exports = function (queryRoute) {
  var projection = {username: 1, admin: 1, email: 1};

  queryRoute("users:activated", function () { return userC.qFind(this, {activated: true}, projection); });

  queryRoute("users:not-activated", function () { return userC.qFind(this, {activated: false}, projection); });

  queryRoute("user:remove", function (data) {
    return userC.qRemoveById(this, {_id: data});
    // TODO remove current connection(s) of user
  });

  queryRoute("user:update", function (data) {
    return userC.qFindByIdAndUpdate(this, {_id: data._id}, data);
    // TODO remove current connection(s) of user to enforce re-acquisition of module-permissions
  });
};
