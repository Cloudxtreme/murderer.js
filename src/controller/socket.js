"use strict";

var _ = require("lodash");
var io = require("socket.io");
var bunyan = require("bunyan");

var bus = require.main.require("./utils/bus").main;
var userC = require.main.require("./core/user/controller");
var config = require.main.require("./utils/config").main;
var connections = require("./connections");

var listeners = {};
var queryRouteListeners = {};

/*============================================= Connection Establishment =============================================*/

function init(server) {
  io = io.listen(server);
  io.sockets.on("connection", function (socket) {
    var log = socket.log = bunyan.logger.socket.child({socket: socket});
    log.info("socket connected");

    socket.on("disconnect", function () {
      log.info("socket disconnected");
      log.end();
      bus.emit("socket:disconnected", socket);
    });

    bus.emit("socket:connected", socket);

    socket.emit("connection:established");
  });
}

bus.on("server:created", init);

/*================================================== Modules Setup  ==================================================*/

var socketSetups = {};
var callId = 0;

_.each(config.modules.all, function (name) {
  var setup = socketSetups[name] = {
    upperName: name[0].toUpperCase() + name.substring(1)
  };
  var listenerMap = listeners[name] = {};
  var queryRouteListener = queryRouteListeners[name] = {};
  setup.applyTo = function (socket, user, log) {
    setupQuery(socket, queryRouteListener, user);
    _.each(listenerMap, function (methods, route) {
      log.info({route: route}, "socket listener-route attached");
      setupListener(socket, route, methods, user);
    });
  };
});

bus.on("socket:authorized", function (data) {
  var user = data.connection.user;
  _.each(socketSetups, function (setup, name) {
    if (userC.isModulePermitted(user, name)) {
      setup.applyTo(data.socket, user, data.connection.log);
    }
  });
});

/*--------------------------------------------------- Query Routes ---------------------------------------------------*/

function setupQuery(socket, routes, user) {
  socket.on("query:send", function (data) {
    if (routes.hasOwnProperty(data.method) && connections.all.hasOwnProperty(user._id)) {
      var method = routes[data.method];
      var conn = connections.all[user._id];
      var log = conn.log.child({method: data.method, id: callId++, transferId: data.id});
      log.info("received query");
      // TODO create middleware functionality like body-validation
      var res = method.call({
        connection: conn,
        user: conn.user,
        log: log
      }, data.data, function (err, response, progress) {
        if (typeof progress !== "undefined") {
          socket.emit("query:progress", {id: data.id, progress: progress});
        } else if (typeof response !== "undefined" || err == null) {
          socket.emit("query:response", {id: data.id, response: response});
        } else {
          if (err instanceof Error) {
            err = _.extend({error: true, message: err.message, name: err.name}, err);
          }
          socket.emit("query:failed", {id: data.id, reason: err});
        }
      });
      if (res != null && typeof res.then === "function") {
        res.then(function (response) {
          socket.emit("query:response", {id: data.id, response: response});
        }, function (err) {
          if (err instanceof Error) {
            err = _.extend({error: true, message: err.message, name: err.name}, err);
          }
          socket.emit("query:failed", {id: data.id, reason: err});
        }, function (progress) {
          socket.emit("query:progress", {id: data.id, progress: progress});
        });
      }
    }
  });
}

_.each(socketSetups, function (setup, name) {
  var queryRouteListener = queryRouteListeners[name];
  module.exports["addQueryRoute" + setup.upperName] = function (route, cb) {
    queryRouteListener[route] = cb;
    bunyan.logger.socket.info({route: route, module: name}, "added query-route");
  };
});

/*------------------------------------------------- Listener Routes  -------------------------------------------------*/

module.exports.on = function (route, callback) {
  bunyan.logger.socket.info({route: route}, "unspecific route added");
  io.sockets.on(route, callback);
};

function setupListener(socket, route, methods, user) {
  socket.on(route, function (data) {
    var conn = connections.all[user._id];
    if (conn == null) {
      return;
    }
    var log = conn.log.child({route: route, id: callId++});
    log.info({data: data}, "route called");
    _.each(methods, function (method) {
      method.call({
        connection: conn,
        log: log
      }, data);
    });
  });
}

_.each(socketSetups, function (setup, name) {
  var listenerMap = listeners[name];
  module.exports["addListenerRoute" + setup.upperName] = function (route, cb) {
    if (listenerMap.hasOwnProperty(route)) {
      listenerMap[route].push(cb);
    } else {
      listenerMap[route] = [cb];
    }
    bunyan.logger.socket.info({route: route, module: name}, "added listener");
  };
});

/*======================================================= Emit =======================================================*/

/*-------------------------------------------------- Custom Routes  --------------------------------------------------*/

function emitFn(route, data) {
  return function (conn) {
    conn.emit(route, data);
  };
}

module.exports.emit = function (userId, route, data) {
  var conn = connections.all[userId];
  if (conn != null) {
    conn.emit(route, data);
  }
};

module.exports.broadcast = function (route, data) {
  _.each(connections.all, emitFn(route, data));
};

module.exports.multicast = function (route, data, iteratee) {
  _.each(_.filter(connections.all, iteratee), emitFn(route, data));
};

_.each(socketSetups, function (setup, name) {
  module.exports["broadcast" + setup.upperName] = function (route, data) {
    _.each(connections.findByModule(name), emitFn(route, data));
  };
  module.exports["multicast" + setup.upperName] = function (route, data, iteratee) {
    _.each(_.filter(connections.findByModule(name), iteratee), emitFn(route, data));
  };
  module.exports["broadcast" + setup.upperName + "Permitted"] = function (route, data) {
    _.each(connections.findByModulePermission(name), emitFn(route, data));
  };
  module.exports["multicast" + setup.upperName + "Permitted"] = function (route, data, iteratee) {
    _.each(_.filter(connections.findByModulePermission(name), iteratee), emitFn(route, data));
  };
});

/*------------------------------------------------------ Alerts ------------------------------------------------------*/

function alert(conn, data) {
  conn.emit("alert", data); // TODO implement client-side
}

function alertFn(data) {
  return function (conn) {
    conn.emit(data);
  };
}

module.exports.alert = function (userId, data) {
  data.targets = "single";
  var conn = connections.all[userId];
  if (conn != null) {
    alert(conn, data);
  }
};

module.exports.alertBroadcast = function (data) {
  data.targets = "all";
  _.each(connections.all, alertFn(data));
};

module.exports.alertMulticast = function (data, iteratee) {
  data.targets = "many";
  _.each(_.filter(connections.all, iteratee), alertFn(data));
};

_.each(socketSetups, function (setup, name) {
  module.exports["alertBroadcast" + setup.upperName] = function (data) {
    data.targets = "all,module";
    _.each(connections.findByModule(name), alertFn(data));
  };
  module.exports["alertMulticast" + setup.upperName] = function (data, iteratee) {
    data.targets = "many,module";
    _.each(_.filter(connections.findByModule(name), iteratee), alertFn(data));
  };
  module.exports["alertBroadcast" + setup.upperName + "Permitted"] = function (data) {
    data.targets = "all,module,modules";
    _.each(connections.findByModulePermission(name), alertFn(data));
  };
  module.exports["alertMulticast" + setup.upperName + "Permitted"] = function (data, iteratee) {
    data.targets = "many,module,modules";
    _.each(_.filter(connections.findByModulePermission(name), iteratee), alertFn(data));
  };
});
