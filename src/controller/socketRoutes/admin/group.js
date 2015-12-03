"use strict";

var groupC = require("../../../core/group/controller/group");

module.exports = function (queryRoute) {
  queryRoute("groups:all", function (data, cb) { groupC.find(this, data, cb); });

  queryRoute("group:remove", function (data, cb) { groupC.removeById(this, data, cb); });

  queryRoute("group:create", function (data, cb) { groupC.create(this, data, cb); });

  queryRoute("group:update", function (data, cb) { groupC.findByIdAndUpdate(this, {_id: data._id}, data, cb); });
};
