"use strict";

var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var express = require("express");

var config = require("../utils/config").main;
var users = require("../core/users/controller/users");

function sendFile(p, res, cb) {
  p = path.join(config.paths.frontend, p);
  fs.exists(p, function (bool) {
    if (bool) {
      res.sendFile(p);
    } else if (cb !== false && (typeof cb !== "function" || cb(bool) === true)) {
      res.sendStatus(404);
    }
  });
}

function sendPlain(req, res) { sendFile(req.path, res, _.noop); }

function sendFileOrIndex(req, res) {
  req.log.debug({fn: "sendFileOrIndex"});
  sendFile(req.path, res, function (bool) {
    if (!bool) {
      sendIndex(req, res);
    }
  });
}

function getUser(req) {
  return req.isAuthenticated() ? req.user : {guest: true};
}

function sendIndex(req, res) {
  req.log.debug({fn: "sendIndex"});
  var user = getUser(req);
  // iterate over permission-ordered modules to fetch first allowed scope
  _.find(config.modules.all, function (name) {
    if (users.belongsToModule(user, name)) {
      sendFile("/" + name + ".html", res);
      return true;
    }
  });
}

var dev = config.server.development;

module.exports.pre = function (app) {
  var router = express.Router();

  // setup files that need module-authentication
  _.each(config.modules.all, function (name) {
    router.get("/" + name + ".html", sendIndex);
  });

  var sendScopeFile = function (req, res) {
    var module = req.params.module;
    var user = getUser(req);
    var permitted = users.isModulePermitted(user, module);
    req.log.debug({fn: "sendScopeFile", permitted: permitted, user: user, module: module});
    if (permitted) {
      sendFile(req.path, res);
    } else {
      res.sendStatus(401);
    }
  };

  if (dev) {
    router.get("/scripts/:module/*.js", sendScopeFile);
    router.get("/styles/:module-*.css", sendScopeFile);
  } else {
    router.get("/scripts/:module.min.js", sendScopeFile);
    router.get("/styles/:module-*.min.css", sendScopeFile);
  }

  app.use(router);
};

module.exports.post = function (app) {
  var router = express.Router();

  router.get("/favicon.ico", sendPlain);
  router.get("/*.*", sendFileOrIndex);
  router.get("/*", sendIndex);

  app.use(router);
};
