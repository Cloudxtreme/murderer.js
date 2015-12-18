"use strict";

var bunyan = require("bunyan");
var express = require("express");
var passport = require("passport");

var userC = require.main.require("./core/user/controller");

var MIN_DELAY = 1000;
var CLEAR_INTERVAL = 1000 * 60 * 60; // 1h

var rates = {};

setInterval(function () {
  bunyan.logger.app.debug("clear saved login route rates");
  // clear all stored rates hourly not to fill up memory over time
  for (var key in rates) { if (rates.hasOwnProperty(key)) { rates[key] = {}; } }
}, CLEAR_INTERVAL);

function checkRate(key) {
  rates[key] = {};
  return function (req, res, next) {
    var rate = rates[key];
    var clientId = req.connection.remoteAddress;
    var now = Date.now();
    if (rate.hasOwnProperty(clientId) && rate[clientId] > now) { return res.status(429).send(); }
    rate[clientId] = now + MIN_DELAY;
    next();
  };
}

function logout(req, res) {
  req.logOut();
  res.redirect("/");
}

function register(req, res) {
  userC.create(req, req.body, function (err, user) {
    if (err != null) { return res.status(400).send(err.message); }
    req.log.info({user: user}, "user registered");
    req.logIn(user, function (err) {
      if (err != null) { return res.status(500).send("Login failed."); }
      res.status(204).send();
    });
  });
}

//noinspection JSUnresolvedFunction
var login = passport.authenticate("local");

module.exports = function (app) {
  var router = express.Router();

  router.post("/register", checkRate("register"), register);

  router.post("/login", checkRate("login"), login, function (req, res) { return res.status(204).send(); });

  router.get("/logout", logout);

  app.use(router);
};
