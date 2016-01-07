"use strict";

var _ = require("lodash");
var express = require("express");

var config = require.main.require("./utils/config").main;

var ROBOTS_TXT_DEV = "User-agent: *\nDisallow: /";
var ROBOTS_TXT_PROD = "User-agent: *\nAllow:";

module.exports = function (app) {
  var router = express.Router();

  router.get("/robots.txt", _.partial(sendConstant, getRobotsTxt()));

  app.use(router);
};

function sendConstant(str, ignored, res) { res.end(str); }

function getRobotsTxt() { return config.server.development ? ROBOTS_TXT_DEV : ROBOTS_TXT_PROD; }
