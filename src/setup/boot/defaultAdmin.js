"use strict";

var _ = require("lodash");
var Q = require("q");
var bunyan = require("bunyan");

var userC = require.main.require("./core/user/controller");
var config = require.main.require("./utils/config").main;
var security = require.main.require("./utils/security");

var body = {
  username: "root",
  usernameLower: "root",
  email: "ole@reglitzki.de",
  admin: true,
  group: "Zsh",
  activated: true,
  password: security.generateRandom(6)
};

/**
 * This Module creates a new admin-user if none is existent.
 */
module.exports = function () {
  return userC.findByModulePermission(config.modules.admin, function (err, admins) {
    var log = bunyan.logger.app.child({boot: "default admin creation"}, null, true);

    if (err != null) {
      return log.error({err: err}, "admin-search failed");
    }
    if (admins.length) {
      log.info({amount: admins.length}, "admins found");
      return;
    }

    var conn = {
      user: userC.createAdmin(),
      log: log
    };

    var defer = Q.defer();
    var extend = _.extend(body, config.defaultAdmin);

    userC.findByUsername(conn, extend.username, function (err, user) {
      if (err != null) {
        return defer.reject(err);
      }
      if (user == null) {
        return defer.resolve();
      }
      userC.remove(conn, user, function (err) {
        if (err == null) {
          defer.resolve();
        } else {
          defer.reject();
        }
      });
    });

    return defer.promise.then(function () {
      return userC.create(conn, extend, function (err) {
        if (err != null) {
          return log.error({err: err}, "admin-creation failed");
        }
        log.info({user: extend}, "user created");
      });
    }, function (err) {
      log.error({err: err}, "clean-up of user called \'admin\' failed");
    });
  });
};
