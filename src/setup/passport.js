"use strict";

var passport = require("passport");
var passportLocal = require("passport-local");

var security = require("../utils/security");
var users = require("../core/users/models/users");

module.exports = function (app) {

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function (user, cb) {
    cb(null, user._id.toHexString());
  });

  passport.deserializeUser(users.findById);

  passport.use(new passportLocal.Strategy(function (username, password, cb) {
    users.findByUsername(username, function (err, user) {
      if (err != null) {
        cb(err);
      } else if (user == null || !security.checkPassword(password, user.hashedPassword)) {
        cb(null, false, {message: "validation.login.invalid"});
      } else {
        cb(null, user);
      }
    });
  }));
};
