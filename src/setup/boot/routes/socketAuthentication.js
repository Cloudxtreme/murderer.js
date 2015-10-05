"use strict";

var bunyan = require("bunyan");

var bus = require("../../../utils/bus").main;
var connections = require("../../../controller/connections");
var security = require("../../../utils/security");
var userC = require("../../../core/user/controller/user");
var config = require("../../../utils/config").main;

/*
 This controller allows socket connections to get authenticated.
 New clients have to authorize (passport) using http(s), a token gets returned.
 Once a socket emits this token it gets associated with the authenticated client.
 */

var tokens = {};

bus.on("socket:connected", function (socket) {
  return socket.on("connection:authorize", function (data) {
    if (data == null || typeof data !== "object") {
      return;
    }
    var token = data.token;
    var userId = data.userId;

    var user, tUser;
    if (tokens.hasOwnProperty(userId)) {
      var obj = tokens[userId];
      if (obj.token === token) {
        obj.log.debug("used");
        removeToken(userId);
        user = obj.user;
        tUser = obj.transport;
      } else {
        obj.log.warn("rejected");
        user = tUser = userC.createGuest();
      }
    } else {
      user = tUser = userC.createGuest();
    }

    var conn = connections.add(user, socket);
    socket.emit("connection:authorized", tUser);
    return bus.emit("socket:authorized", {socket: socket, connection: conn});
  });
});

function removeToken(userId) {
  var obj = tokens[userId];
  if (obj == null) {
    return;
  }
  clearTimeout(obj.timeout);
  obj.log.debug("removed");
  obj.log.end();
  delete tokens[userId];
}

function createToken(req, res) {
  var user = req.isAuthenticated() ? req.user : userC.createGuest();
  if (tokens.hasOwnProperty(user._id)) {
    removeToken(user._id);
  }
  var token = security.generateToken();
  var obj = tokens[user._id] = {
    token: token,
    user: user,
    transport: userC.getTransportCopy(user),
    log: bunyan.logger.token.child({user: user, token: token, type: "socket authentication"})
  };
  obj.log.info("created");
  var timeout = config.security.token.expires.sessionAuth || 5000;
  obj.timeout = setTimeout(function () {
    removeToken(user._id);
  }, timeout);
  res.send({
    user: obj.transport,
    token: token,
    expires: new Date(Date.now() + timeout)
  });
}

module.exports = function (app) {
  app.get("/connection/authToken", createToken);
};
