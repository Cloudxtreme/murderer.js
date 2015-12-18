"use strict";

var Q = require("q");

var controller = require("../controller");

// TODO implement email verification

/*===================================================== Exports  =====================================================*/

exports.trigger = update;

/*==================================================== Functions  ====================================================*/

function update(scope, newEmail) {
  return controller
      .qFindByIdAndUpdate(scope, scope.user._id, {email: newEmail}, {new: true})
      .fail(function (err) {
        scope.log.error({email: newEmail, err: err}, "user email update failed");
        return Q.reject(err);
      });
}
