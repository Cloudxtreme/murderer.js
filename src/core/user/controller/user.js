"use strict";

var _ = require("lodash");
var mailer = require("nodemailer");

var model = require("../model/user");
var security = require("../../../utils/security");
var ctrlBase = require("../../../utils/controllerBase");
var connections = require("../../../controller/connections");
var config = require("../../../utils/config").main;
var tpl = require("../../../utils/templates");

var emailTransporter = mailer.createTransport({
  host: config.mailer.host,
  port: config.mailer.port,
  secure: config.mailer.secure,
  auth: {
    user: config.mailer.username,
    pass: config.mailer.password
  }
});

ctrlBase(model, module.exports);

/*==================================================== Utilities  ====================================================*/

function saveUser(scope, errData, cb) {
  return scope.user.save(function (err) {
    if (err != null) {
      errData.err = err;
      scope.log.error(errData);
    }
    cb.apply(this, arguments);
  });
}

function getEmailData(user) {
  return {
    name: config.pkg.name, // TODO pass whole config.pkg, adjust templates to accept nesting
    id: user._id,
    username: user.username,
    email: user.email
  };
}

function sendMail(email, body, cb) {
  cb = cb || _.noop;
  if (config.mailer.host) {
    emailTransporter.sendMail(_.extend(body, {
      to: email,
      from: config.mailer.email
    }), cb);
  } else {
    cb();
  }
}

function applyPasswordVerificationToken(user) {
  user.resetPasswordExpires = _.now() + (config.security.token.expires.passwordReset || 3600000 /* 1h */);
  return user.resetPasswordToken = security.generateToken();
}

/*================================================ Additional Exports ================================================*/

/*------------------------------------------------- Model forwarding -------------------------------------------------*/

module.exports.findByModule = model.findByModule;
module.exports.findByModulePermission = model.findByModulePermission;
module.exports.belongsToModule = model.belongsToModule;
module.exports.isModulePermitted = model.isModulePermitted;

module.exports.getTransportCopy = model.getTransportCopy;
module.exports.createGuest = model.createGuest;
module.exports.createAdmin = model.createAdmin;

/*---------------------------------------------------- Utilities  ----------------------------------------------------*/

module.exports.sendMail = function (ignored, email, body, cb) {
  sendMail(email, body, cb);
};

module.exports.sendMailByKey = function (scope, key, user, data, cb) {
  var mail = _.get(config.mails, key);
  data = _.extend(getEmailData(user), data);
  sendMail(user.email, {
    subject: tpl(mail.subject, data) + "\n",
    text: tpl(mail.message, data) + "\n"
  }, cb);
  scope.log.info({data: data, key: key, addressee: user}, "email sent");
};

/*------------------------------------------------ Self modifications ------------------------------------------------*/

module.exports.updateSelf = function (scope, data, cb) {
  module.exports.findById(scope, scope.user._id, function (err, user) {
    if (err != null) {
      return cb(err);
    }
    _.extend(user, _.omit(data, model.INTERNAL_VALUES));
    saveUser({user: user, log: scope.log}, {msg: "user update failed"}, cb);
  });
};

module.exports.updatePassword = function (scope, password, newPassword, cb) {
  var user = scope.user;
  if (!security.checkPassword(password, user.hashedPassword)) {
    return cb("Wrong Password");
  }

  user.changedPassword = config.security.secret; // TODO maybe insecure?
  user.password = newPassword;
  saveUser({user: user, log: scope.log}, {msg: "user password-update failed"}, cb);
};

module.exports.removeSelf = function (scope, cb) {
  module.exports.findByIdAndRemove(scope, scope.user._id, cb);
};

/*------------------------------------------------- update password  -------------------------------------------------*/

module.exports.requestPasswordToken = function (scope, email, cb) {
  module.exports.findByEmail(scope, email, function (err, user) {
    if (err != null || user == null) {
      return cb(err);
    }
    var token = applyPasswordVerificationToken(user);

    saveUser({user: user, log: scope.log}, {email: email, msg: "user password-reset request failed"}, function (err) {
      if (err != null) {
        return cb(err);
      }
      // Send the reset email to the user
      var mail = config.mails.account.passwordResetRequest;
      var data = _.extend(getEmailData(user), {
        link: config.server.url + "reset-password/" + user.username + "/" + token
      });
      sendMail(user.email, {
        subject: tpl(mail.subject, data) + "\n",
        text: tpl(mail.message, data) + "\n"
      }, cb);
    });
  });
};

module.exports.updatePasswordByToken = function (scope, username, token, newPassword, cb) {
  var now = _.now();
  module.exports.findByUsername(scope, username, function (err, user) {
    if (err != null) {
      return cb(err);
    }
    if (!user || user.resetPasswordToken !== token || !(user.resetPasswordExpires >= now)) { // jshint ignore:line
      return cb("Invalid token or username");
    }

    user.changedPassword = config.security.secret; // TODO maybe insecure?
    user.password = newPassword;
    applyPasswordVerificationToken(user);

    saveUser({user: user, log: scope.log}, {
      username: username,
      token: token,
      msg: "user password-update failed"
    }, function (err) {
      if (err != null) {
        return cb(err);
      }
      var args = arguments;
      // Send the reset email to the user
      var mail = config.mails.account.passwordReset;
      if (mail) {
        var data = getEmailData(user);
        sendMail(user.email, {
          subject: tpl(mail.subject, data) + "\n",
          text: tpl(mail.message, data) + "\n"
        }, function (err) {
          if (err != null) {
            return cb(err);
          }
          cb.apply(this, args);
        });
      } else {
        cb.apply(this, args);
      }
    });
  });
};

/*----------------------------------------------- update email-address -----------------------------------------------*/

module.exports.updateEmail = function (scope, newEmail, cb) {
  // Generate a new token for the email verification
  var user = scope.user;
  user.email = newEmail;

  saveUser({user: user, log: scope.log}, {email: newEmail, msg: "user email update failed"}, cb);
};

/*============================================ Validation and Middleware  ============================================*/

/*---------------------------------------------------- Validation ----------------------------------------------------*/

var validate = module.exports.validate;

// TODO except for admin-creation disable possibility to set various fields on create and save

validate("create", function (next, body) {
  body.usernameLower = body.username.toLowerCase();
  if (!body.email) {
    return next(new Error("Email required"));
  }
  if (!/^[a-z_ 0-9-]{3,}$/.test(body.usernameLower)) {
    return next(new Error("Username may not contain special characters."));
  }

  if (!body.avatarUrl) {
    body.avatarUrl = "//www.gravatar.com/avatar/" + security.md5(body.email.toLowerCase()) + "?d=identicon&s=50";
  }

  next();
});

validate("remove", function (next, filter) {
  if (filter == null || !filter.hasOwnProperty("_id") || typeof filter._id !== "string") {
    return next(new Error("User remove only allowed by ID"));
  }

  var id = filter._id;
  if (id !== this.user._id && !this.user.admin) {
    return next(new Error("You are not allowed to remove this user"));
  }

  next();
});

/*---------------------------------------------------- Pre-Hooks  ----------------------------------------------------*/

var pre = module.exports.pre;

pre("save", function (next) {
  // disallow password-/email-change except for updatePassword-/updateEmail
  if (!this.isNew) {
    if (this.changedPassword && this.changedPassword !== config.security.secret) {
      return next("No permission to change password");
    } else {
      delete this.hashedPassword;
    }
    if (this.changedEmail && this.changedEmail !== config.security.secret) {
      return next("No permission to change email");
    } else {
      delete this.email;
    }
  }
  delete this.changedPassword;
  delete this.changedEmail;
  this.bio = this.bio != null ? this.bio.substring(0, 256) : "";
  next();
});

/*---------------------------------------------------- Post-Hooks ----------------------------------------------------*/

var post = module.exports.post;

post("save", function (user) {
  connections.updateUser(user);
});

post("remove", function (user) {
  // remove user from active connections
  connections.removeUser(user._id);
  // Send confirmation email to the user
  var mail = config.mails.account.removed;
  var data = getEmailData(user);
  sendMail(user.email, {
    subject: tpl(mail.subject, data) + "\n",
    text: tpl(mail.message, data) + "\n"
  }, _.noop);
});
