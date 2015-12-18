"use strict";

var _ = require("lodash");
var Q = require("q");
var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");

var email = require("./services/email");
var sample = require("./services/sample");
var transport = require("./services/transport");
var permission = require("./services/permission");
var emailUpdate = require("./services/emailUpdate");
var passwordUpdate = require("./services/passwordUpdate");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

exports.findByModule = permission.findByModule;
exports.findByModulePermission = permission.findByModulePermission;
exports.belongsToModule = permission.belongsToModule;
exports.isModulePermitted = permission.isModulePermitted;

exports.createGuest = sample.createGuest;
exports.createAdmin = sample.createAdmin;

exports.createTransport = transport.createTransport;

exports.qSendMailByKey = email.sendTemplateByKey;

exports.qRequestPasswordToken = passwordUpdate.requestPasswordToken;
exports.qUpdatePasswordByToken = passwordUpdate.updatePasswordByToken;

exports.qUpdateEmail = emailUpdate.trigger;

exports.qRemoveSelf = function (scope) { return exports.qFindByIdAndRemove(scope, scope.user._id); };
exports.qUpdateSelf = qUpdateSelf;

/*==================================================== Functions  ====================================================*/

function qUpdateSelf(scope, data) {
  exports
      .qFindByIdAndUpdate(scope, scope.user._id, _.omit(data, model.LOCKED_FIELDS), {new: true})
      .fail(function (err) {
        scope.log.error({err: err}, "user update failed");
        return Q.reject(err);
      });
}
