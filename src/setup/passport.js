"use strict";

var passport = require("passport");
var passportLocal = require("passport-local");

var security = require.main.require("./utils/security");
var userModel = require.main.require("./core/user/model");

module.exports = function (app) {

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, cb) {
    cb(null, user._id.toHexString());
  });

  passport.deserializeUser(userModel.findById);

  passport.use(new passportLocal.Strategy(function (username, password, cb) {
    userModel.findByUsername(username, function (err, user) {
      if (err != null) {
        cb(err);
      } else if (user == null || !security.checkPassword(password, user.pw)) {
        cb(null, false, {message: "validation.login.invalid"});
      } else {
        cb(null, user);
      }
    });
  }));
};
