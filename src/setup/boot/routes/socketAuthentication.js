"use strict";

var bunyan = require("bunyan");

var bus = require.main.require("./utils/bus").main;
var connections = require.main.require("./controller/connections");
var security = require.main.require("./utils/security");
var userC = require.main.require("./core/user/controller");
var config = require.main.require("./utils/config").main;

var DEFAULT_SESSION_AUTH_TIMEOUT = 15000;

/*
 This controller allows socket connections to get authenticated.
 New clients have to authorize (passport) using http(s), a token gets returned.
 Once a socket emits this token it gets associated with the authenticated client.
 */

var tokens = {};
var mainLogger = bunyan.logger.token;
var timeout = config.security.token.expires.sessionAuth || DEFAULT_SESSION_AUTH_TIMEOUT;

bus.on("socket:connected", function (socket) {
  socket.on("connection:authorize", function (data) {
    if (data == null || typeof data !== "object") { return; }

    var token = data.token;
    var userId = data.userId;
    var user = null;

    if (tokens.hasOwnProperty(userId)) {
      var obj = tokens[userId];
      if (obj.token === token) {
        obj.log.debug("used");
        removeToken(userId);
        user = obj.user;
      } else {
        obj.log.warn("rejected");
      }
    }

    if (user == null) {
      socket.emit("connection:error", {code: 401, message: "Invalid token.", name: "token.invalid"});
    } else {
      var conn = connections.add(user, socket);
      socket.emit("connection:authorized");
      bus.emit("socket:authorized", {socket: socket, connection: conn});
    }
  });
});

function removeToken(userId) {
  if (!tokens.hasOwnProperty(userId)) { return; }

  var obj = tokens[userId];
  clearTimeout(obj.timeout);
  obj.log.debug("removed");
  obj.log.end();
  delete tokens[userId];
}

function createToken(req, res) {
  var user = req.isAuthenticated() ? req.user : userC.createGuest();
  if (tokens.hasOwnProperty(user._id)) { removeToken(user._id); }
  var token = security.generateToken();
  var expires = new Date(Date.now() + timeout);
  var logger = mainLogger.child({user: user, token: token, expires: expires, type: "socket authentication"});
  var obj = tokens[user._id] = {token: token, user: user, log: logger};
  logger.info("auth token created");
  obj.timeout = setTimeout(function () { removeToken(user._id); }, timeout);
  res.send({user: userC.createTransport(user), token: token, expires: expires});
}

module.exports = function (app) {
  app.get("/connection/authToken", createToken);
};
