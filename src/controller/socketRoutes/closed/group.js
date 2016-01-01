"use strict";

var _ = require("lodash");
var Q = require("q");

var groupsC = require.main.require("./core/group/controller");

module.exports = function (queryRoute) {
  queryRoute("groups:populate", function (data) {
    if (!(data instanceof Array)) { return Q.reject("Bad request."); }
    var scope = this;
    return Q.all(_.map(data, function (groupId) { return groupsC.qFindById(scope, groupId); }));
  });
};
