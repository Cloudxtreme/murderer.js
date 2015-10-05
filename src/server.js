"use strict";

var _ = require("lodash");
var Q = require("q");
var fs = require("fs");
var path = require("path");
var bunyan = require("bunyan");
var express = require("express");
var mongoose = require("mongoose");

var bus = require("./utils/bus").main;
var files = require("./utils/files");
var config = require("./utils/config").main;

function createServer(log) {
  // initialize the express front controller
  var app = express();
  // bootstrap application settings
  require("./setup/express")(app);
  // setup user authentication
  require("./setup/passport")(app);
  // setup local login routes
  require("./setup/boot/routes/localLogin")(app);
  // define application routes (higher priority than routes by boot-scripts)
  var routes = require("./setup/routes");
  routes.pre(app);

  // call available boot-scripts
  var waiting = [];
  files.eachFileRecursive(path.join(config.paths.backend, "setup/boot/"), function (filename) {
    if (files.isJavaScriptFile(filename)) {
      try {
        var result = require(filename)(app, log);
        var isPromise = result != null && typeof result.then === "function";
        log.info({file: filename, async: isPromise}, "boot-script initialized");
        if (isPromise) {
          waiting.push(result);
        }
      } catch (e) {
        log.error({err: e, file: filename}, "boot-script init failed");
      }
    } else {
      log.warn({
        file: filename,
        type: "javascript"
      }, "file-extension seems not to match expected type, asserted boot-script");
    }
  });

  // TODO allow config to set additional boot-scripts directories

  return Q.all(waiting).then(function () {
    // define fallback application routes (if no other route-definition has matched)
    routes.post(app);
    // create server-instance
    if (config.server.tls != null) {
      var tls = config.server.tls;
      try {
        return require("https").createServer(_.extend(tls, {
          key: fs.readFileSync(path.join(config.cwd, tls.key)),
          cert: fs.readFileSync(path.join(config.cwd, tls.cert))
        }), app);
      } catch (e) {
        log.error({err: e}, "creating https-server failed");
        return require.main.exports.exit(15);
      }
    }
    return require("http").createServer(app);
  });
}

function requireRecursive(cwd, dirs, name, log) {
  files.eachFileWithinDirsRecursive(cwd, dirs, function (filename) {
    if (files.isJavaScriptFile(filename)) {
      try {
        require(filename);
        log.info({file: filename, type: name}, "initialized");
      } catch (e) {
        log.error({err: e, file: filename, type: name}, "init failed");
      }
    } else {
      log.warn({file: filename, type: name}, "file-extension seems not to be javascript");
    }
  });
}

function initSockets(log) {
  var socket = require("./controller/socket");
  _.each(config.modules.all, function (name) {
    var upperName = name[0].toUpperCase() + name.substring(1);
    var qRoute = socket["addQueryRoute" + upperName];
    var lRoute = socket["addListener" + upperName];
    files.eachFileRecursive(path.join(config.paths.backend, "controller/socketRoutes/", name), function (filename) {
      if (files.isJavaScriptFile(filename)) {
        try {
          require(filename)(qRoute, lRoute);
          log.info({file: filename, module: name}, "socket-routes initialized");
        } catch (e) {
          log.error({err: e, file: filename, module: name}, "socket-routes init failed");
        }
      } else {
        log.warn({file: filename}, "file-extension seems not to be javascript, asserted socket-routes");
      }
    });
  });
  return log;
}

module.exports = function () {
  var coreDir = config.paths.core = path.join(config.paths.backend, "core");

  var log = bunyan.logger.app.child({config: config});

  log.info("server startup");

  requireRecursive(coreDir, "handler", "handler", log);

  var dbLog = log.child({db: config.database});
  // connect database, update database schema, initialize socket-management and start server
  mongoose.connect(config.database, function (err) {
    if (err != null) {
      dbLog.error({err: err}, "database connection failed");
      return require.main.exports.exit(14);
    }
    mongoose.connection.on("error", function (err) {
      dbLog.error({dbErr: err}, "database connection got an error");
    });
    // attach log to mongoose and emit event
    (mongoose.log = dbLog).info("database connected");
    // load all models
    requireRecursive(coreDir, "model", "model", dbLog);
    bus.emit("database:connected", mongoose);
    // initialize sockets
    initSockets(log);
    // create server
    createServer(log)
        .catch(function (err) { throw err; })
        .then(function (server) {
          var defer = Q.defer();
          bus.emit("server:created", server);
          server.listen(config.server.port);
          server.on("error", function (err) {
            defer.reject(err);
          });
          server.on("listening", function () {
            log.info("server is listening");
            defer.resolve(server);
          });
          return defer.promise;
        })
        .catch(function (err) {
          if (err.code === "EADDRINUSE") {
            log.error({err: err}, "the port is already in use");
          } else {
            log.error({err: err}, "server error");
          }
          require.main.exports.exit(13);
        })
        .then(function (server) {
          bus.emit("server:listening", server);
        });
  });
};
