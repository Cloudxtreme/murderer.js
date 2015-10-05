"use strict";

var _ = require("lodash");
var bunyan = require("bunyan");

var bus = require("../utils/bus").main;
var userC = require("../core/user/controller/user");

var connections;

connections = {};

/*------------------------------------------------- Create / Update  -------------------------------------------------*/

function createConnection(user) {
  return connections[user._id] = {
    sockets: {},
    user: user,
    emit: function (messageId, data) {
      _.each(this.sockets, function (socket) {
        socket.emit(messageId, data);
      });
    },
    log: bunyan.logger.socket.child({user: user})
  };
}

module.exports.updateUser = function (user) {
  if (_.has(connections, user._id)) {
    connections[user._id].user = user;
  }
};

module.exports.add = function (user, sock) {
  var conn;
  if (_.has(connections, user._id)) {
    conn = connections[user._id];
    conn.user = user;
  } else {
    conn = createConnection(user);
  }
  conn.sockets[sock.id] = sock;
  conn.log.info({socket: sock}, "associated socket");
  return conn;
};

/*---------------------------------------------------- Get / Find ----------------------------------------------------*/

module.exports.all = connections;

module.exports.bySocket = function (socket) {
  return _.find(connections, function (conn) {
    return _.has(conn.sockets, socket.id);
  });
};

module.exports.findByModule = function (name) {
  return _.filter(connections, function (conn) {
    return userC.belongsToModule(conn.user, name);
  });
};

module.exports.findByModulePermission = function (name) {
  return _.filter(connections, function (conn) {
    return userC.isModulePermitted(conn.user, name);
  });
};

/*------------------------------------------------------ Remove ------------------------------------------------------*/

function removeUser(id) {
  connections[id].log.end();
  delete connections[id];
}

module.exports.removeUser = function (userId) {
  if (_.has(connections, userId)) {
    removeUser(userId);
  }
};

module.exports.remove = function (socket) {
  var conn;
  conn = module.exports.bySocket(socket);
  if (conn != null) {
    delete conn.sockets[socket.id];
    if (_.isEmpty(conn.sockets)) {
      removeUser(conn.user._id);
    }
  }
};

bus.on("socket:disconnected", function (socket) {
  module.exports.remove(socket);
});
