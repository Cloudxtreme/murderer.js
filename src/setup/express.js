"use strict";

var compression = require("compression");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var bunyan = require("bunyan");
var mongoStore = require("connect-mongo")(session);

var config = require("../utils/config").main;

module.exports = function (app) {
  // Compression
  app.use(compression({
    threshold: 512 // compress if 512kb or above
  }));

  // Body parser
  //noinspection JSUnresolvedFunction
  app.use(bodyParser.urlencoded({extended: true}));
  //noinspection JSCheckFunctionSignatures
  app.use(bodyParser.json());
  app.use(methodOverride(function (req) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      //noinspection JSUnresolvedVariable
      var method = req.body._method;
      //noinspection JSUnresolvedVariable
      delete req.body._method;
      return method;
    }
  }));

  // Express/MongoDB session storage
  app.use(cookieParser());
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.security.secret || config.pkg.name + "-" + config.env,
    cookie: {
      maxAge: config.security.session.expires
    },
    store: new mongoStore({
      url: config.database,
      collection: "sessions"
    })
  }));

  var nextId = 0;
  // add logger and id to each request
  app.use(function (req, res, next) {
    req.id = nextId++;
    req.log = bunyan.logger.http.child({req: req, user: req.user}, null, true);
    next();
  });
};
