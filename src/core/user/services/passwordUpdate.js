"use strict";

var _ = require("lodash");
var Q = require("q");

var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;
var controller = require("../controller");

/*===================================================== Exports  =====================================================*/

exports.requestPasswordToken = requestPasswordToken;
exports.updatePasswordByToken = updatePasswordByToken;

/*==================================================== Functions  ====================================================*/

function qSave(user) { return Q.nbind(user.save, user)(); } // TODO attach q-methods within modelBase

function applyPasswordVerificationToken(user) {
  user.resetPasswordExpires = _.now() + (config.security.token.expires.passwordReset || 3600000 /* 1h */);
  user.resetPasswordToken = security.generateToken();
  return user;
}

function requestPasswordToken(scope, email) {
  return controller
      .qFindByEmail(scope, email)
      .then(function (user) {
        if (user == null) { throw (new Error("User not found.")); }
        return applyPasswordVerificationToken(user);
      })
      .then(qSave)
      .then(function (user) {
        var data = {link: config.server.url + "reset-password/" + user.username + "/" + user.resetPasswordToken};
        return controller.qSendMailByKey(scope, user, "account.passwordResetRequest", data);
      }, function (err) {
        scope.log.error({err: err, email: email}, "user password-reset request failed");
        throw err;
      });
}

function updatePasswordByToken(scope, username, token, newPassword) {
  var now = _.now();
  return controller
      .qFindByUsername(scope, username)
      .then(function (err, user) {
        if (!user || user.resetPasswordToken !== token || !(user.resetPasswordExpires >= now)) { // jshint ignore:line
          throw("Invalid token or username");
        }
        user.changedPassword = config.security.secret; // TODO might be insecure?
        user.password = newPassword;
        return applyPasswordVerificationToken(user);
      })
      .then(qSave)
      .then(function (user) {
        return controller
            .qSendMailByKey(scope, user, "account.passwordReset")
            .fail(function (err) { scope.log.warn({err: err}, "password reset approval not sent"); });
      }, function (err) {
        scope.log.error({err: err, username: username, token: token}, "user password update failed");
        throw err;
      });
}
