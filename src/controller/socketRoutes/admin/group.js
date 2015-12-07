"use strict";

var groupC = require("../../../core/group/controller/group");

module.exports = function (queryRoute) {
  queryRoute("groups:all", function (data) { return groupC.qFind(this, data); });

  queryRoute("group:remove", function (data) { return groupC.qRemoveById(this, data); });

  queryRoute("group:create", function (data) { return groupC.qCreate(this, data); });

  queryRoute("group:update", function (data) { return groupC.qFindByIdAndUpdate(this, {_id: data._id}, data); });
};
