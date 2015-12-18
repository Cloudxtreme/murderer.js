"use strict";

var _ = require("lodash");

var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;
var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.requestPasswordToken = requestPasswordToken;
exports.updatePasswordByToken = updatePasswordByToken;

/*==================================================== Functions  ====================================================*/

function requestPasswordToken(scope, email) {
  var body = {
    resetPasswordExpires: _.now() + (config.security.token.expires.passwordReset || 3600000 /* 1h */),
    resetPasswordToken: security.generateToken()
  };
  return controller
      .qFindByEmailAndUpdate(scope, email, body, {new: true})
      .then(function (user) {
        if (user == null) { throw new Error("User not found."); }
        var data = {link: config.server.url + "reset-password/" + user.username + "/" + user.resetPasswordToken};
        return controller.qSendMailByKey(scope, user, "account.passwordResetRequest", data);
      }).fail(function (err) {
        scope.log.error({err: err, email: email}, "user password-reset request failed");
        throw err;
      });
}

function updatePasswordByToken(scope, username, token, newPassword) {
  var now = _.now();
  return controller
      .qFindByUsername(scope, username)
      .then(function (err, user) {
        if (user == null) { throw new Error("User not found."); }
        if (user.resetPasswordExpires == null || user.resetPasswordExpires < now || user.resetPasswordToken !== token) {
          throw("Invalid token.");
        }
        return controller
            .qFindByIdAndUpdate(scope, user._id, {
              pw: security.encryptPassword(newPassword),
              resetPasswordExpires: null,
              resetPasswordToken: null
            }, {new: true});
      })
      .then(function (user) {
        return controller
            .qSendMailByKey(scope, user, "account.passwordReset")
            .fail(function (err) { scope.log.warn({err: err}, "password reset approval not sent"); });
      }, function (err) {
        scope.log.error({err: err, username: username, token: token}, "user password update failed");
        throw err;
      });
}
