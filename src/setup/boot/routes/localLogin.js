"use strict";

var express = require("express");
var passport = require("passport");

var userC = require("../../../core/user/controller/user");

function logout(req, res) {
  req.logOut();
  res.redirect("/");
}

function register(req, res) {
  userC.create(req, req.body, function (err, user) {
    if (err != null) {
      res.redirect("/register/#" + err.message);
      return;
    }
    req.logIn(user, function (err) {
      res.redirect(err != null ? "/register/#" + err.message : "/");
    });
  });
}

//noinspection JSUnresolvedFunction
var login = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login#failed"
});

module.exports = function (app) {
  var router = express.Router();

  router.post("/register", register);

  router.post("/login", login);

  router.get("/logout", logout);

  app.use(router);
};
