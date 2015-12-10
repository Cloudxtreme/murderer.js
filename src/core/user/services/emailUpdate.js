"use strict";

var Q = require("q");

// TODO implement email verification

/*===================================================== Exports  =====================================================*/

exports.trigger = update;

/*==================================================== Functions  ====================================================*/

function qSave(user) { return Q.nbind(user.save, user)(); } // TODO attach q-methods within modelBase

function update(scope, newEmail) {
  var user = scope.user;
  user.email = newEmail;

  return qSave(user)
      .fail(function (err) {
        scope.log.error({email: newEmail, err: err}, "user email update failed");
        return Q.reject(err);
      });
}
