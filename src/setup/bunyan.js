"use strict";

var _ = require("lodash");
var path = require("path");
var wrench = require("wrench");
var Bunyan = require("bunyan");
var childProcess = require("child_process");

var config = require.main.require("./utils/config").main;
var files = require.main.require("./utils/files");
var RingBuffer = require.main.require("./utils/bunyan/RingBuffer");

/*============================================ Modify bunyan to our needs ============================================*/

Bunyan.logger = {};
Bunyan.process = null;
Bunyan.ExtendedRingBuffer = RingBuffer;
Bunyan.additionalTypes = {};

var getBunyanProcess = Bunyan.getProcess = function () {
  if (Bunyan.process == null) {
    var args = __slice.call(arguments).concat(config.logging.processArgs || []);
    Bunyan.process = childProcess.spawn(bunyanBinPath, args, {stdio: ["pipe", process.stdout]});
    cliSetup();
  }
  return Bunyan.process;
};

var types = Bunyan.additionalTypes;
types.ringbuffer = function (s) {
  s.type = "raw";
  s.stream = new RingBuffer(s, false, this);
  this.needsChildHook = true;
};
types.console = function (s) {
  s.type = "stream";
  s.stream = getBunyanProcess().stdin;
};
types.stdout = types.stderr = function (s, ignored, type) {
  s.type = "stream";
  s.stream = process[type];
};

/*------------------------------------------------- Add end-function -------------------------------------------------*/

// end: logger has ended, end associated RingBuffers

Bunyan.prototype.end = function () {
  _.each(this.streams, function (stream) {
    if (stream.stream instanceof RingBuffer) {
      stream.stream.done();
    }
  });
};

// shutdown: server is going down, close all streams

Bunyan.prototype.shutdown = function () {
  _.each(this.streams, function (stream) {
    if (typeof stream.stream.end === "function") {
      stream.stream.end();
    }
  });
};

Bunyan.shutdown = function () {
  RingBuffer.shutdown({reason: "process terminates"});
  _.each(Bunyan.logger, function (log) {
    log.shutdown();
  });
};

/*------------------------------------------ Apply addStream-function hook  ------------------------------------------*/

var _addStream = Bunyan.prototype.addStream;

/**
 * Enables a few more stream-types as aliases before forwarding to bunyan/Logger.prototype.addStream.
 * @param s The stream-object to add.
 * @param defaultLevel The default-value for stream-level.
 * @see Bunyan.prototype.addStream
 * @returns {Object} The stream-object that got added (copy of given one).
 */
Bunyan.prototype.addStream = function (s, defaultLevel) {
  var type = s.type = s.type.toLowerCase();
  if (Bunyan.additionalTypes.hasOwnProperty(type) && !s.stream) {
    Bunyan.additionalTypes[type].call(this, s, defaultLevel, type);
  }
  _addStream.call(this, s, defaultLevel);
  return _.last(this.streams);
};

/*-------------------------------------------- Apply child-function hook  --------------------------------------------*/

var _child = Bunyan.prototype.child;

/**
 * After creating a child-logger (see bunyan/Logger.prototype.child) it's streams get post-processed.
 * All RingBuffers get cloned therefor the depth can be considered for buffer-size.
 *
 * @param options
 * @param {Boolean} [simple]
 * @param {Boolean} [skip] if true the post-processing of the child gets skipped. Set to true if no logger-shutdown may
 * happen to prevent wasted memory.
 * @see Bunyan.prototype.child
 * @returns {Logger} The child-logger.
 */
Bunyan.prototype.child = function (options, simple, skip) {
  var c = _child.call(this, options, simple);
  c.needsChildHook = this.needsChildHook && !skip;
  if (c.needsChildHook) {
    _.each(c.streams, function (s) {
      // create clones of all RingBuffers
      if (s.stream instanceof RingBuffer) {
        s.stream = s.stream.child(c);
      }
    });
  }
  return c;
};

/*=================================== Start bunyan process for logging on console  ===================================*/

var __slice = Array.prototype.slice;

var bunyanBinPath = path.resolve(require.resolve("bunyan"), "../../bin/bunyan");

function cliSetup() {
  if (Bunyan.logger.bunyan != null && Bunyan.process != null) {
    Bunyan.logger.bunyan.info({process: Bunyan.process}, "bunyan-process spawned");
  }
}

function prepareLoggerConfig(obj) {
  _.each(obj, function (val, key) {
    if (key === "output") {
      // parse output-value into streams-array
      delete obj.output;
      if (!(obj.streams instanceof Array)) {
        obj.streams = [];
      }
      switch (typeof val) {
        case "object":
          if (val instanceof Array) {
            obj.streams.push.apply(obj.streams, prepareLoggerConfig(val));
          } else {
            obj.streams.push(prepareLoggerConfig(val));
          }
          break;
        case "string":
          obj.streams.push({type: val});
          break;
      }
    } else if (key === "path" && typeof val === "string") {
      obj[key] = files.relative(val);
      wrench.mkdirSyncRecursive(path.dirname(obj[key]));
    } else if (val != null && typeof val === "object") {
      prepareLoggerConfig(val);
    }
  });
  return obj;
}

/*========================================= Logging-Scope specific settings  =========================================*/

/*--------------------------------------------------- Serializers  ---------------------------------------------------*/

function limitObjectDepth(obj, depth) {
  if (obj !== null && typeof obj === "object") {
    if (depth <= 0) {
      if (obj instanceof Array) {
        return "[object Array]";
      }
      return obj.toString();
    }
    depth--;
    var nested = function (o) { return limitObjectDepth(o, depth); };
    if (obj instanceof Date) {
      return obj.toString();
    }
    if (obj instanceof Array) {
      return _.map(obj, nested);
    }
    return _.reduce(obj, function (res, val, key) {
      res[key] = val;
      return res;
    }, {});
  }
  return obj;
}

var dbErrorValues = ["name", "message", "kind", "path", "value"];

var stdSerializers = {
  req: function (req) {
    var obj = Bunyan.stdSerializers.req(req);
    obj.id = req.id;
    return obj;
  },
  serverConfig: function (cfg) {
    var srv = cfg.server;
    return (srv.development ? "dev" : "dist") + "@" + (srv.tls ? "https" : "http") + "://localhost:" + srv.port;
  },
  game: function (game) {
    return {
      _id: game._id,
      name: game.name
    };
  },
  ring: function (ring) { return ring._id; },
  suicides: function (suicides) {
    return _.map(suicides, function (s) {
      var clone = _.clone(s);
      clone.ring = clone.ring._id;
      return clone;
    });
  },
  murder: function (murder) { return murder._id; },
  user: function (user) {
    var obj = {
      _id: user._id,
      username: user.username,
      email: user.email
    };
    if (user.guest) {
      obj.guest = true;
    } else {
      obj.activated = user.activated;
    }
    if (user.admin) {
      obj.admin = true;
    }
    return obj;
  },
  socket: function (socket) { return socket.id; },
  mongoDBModel: function (model) { return model.modelName; },
  modelBody: function (body) { return limitObjectDepth(body, 2); },
  filter: function (body) { return limitObjectDepth(body, 2); },
  logger: function (logger) { return logger.name; },
  process: function (p) { return p.pid; },
  dbErr: function (err) {
    var obj = Bunyan.stdSerializers.err(err);
    obj.errors = _.reduce(err.errors, function (res, err, key) {
      res[key] = _.pick(err, dbErrorValues);
      return res;
    }, {});
    return obj;
  }
};

var querySerializer = {
  err: Bunyan.stdSerializers.err,
  user: stdSerializers.user,
  addressee: stdSerializers.user,
  game: stdSerializers.game,
  ring: stdSerializers.ring,
  murder: stdSerializers.murder,
  suicides: stdSerializers.suicides,
  model: stdSerializers.mongoDBModel,
  body: stdSerializers.modelBody,
  filter: stdSerializers.modelBody
};

var serializer = {
  app: { // used for application-borders, eg. server-creation, database-connection, etc.
    err: Bunyan.stdSerializers.err,
    dbErr: stdSerializers.dbErr,
    game: stdSerializers.game,
    model: stdSerializers.mongoDBModel,
    config: stdSerializers.serverConfig
  },
  token: { // used for tokens, eg. authentication-tokens
    err: Bunyan.stdSerializers.err,
    user: stdSerializers.user
  },
  socket: _.extend({}, querySerializer, { // used for websocket-connections
    socket: stdSerializers.socket
  }),
  http: _.extend({}, querySerializer, { // used for http(s)-connections
    req: stdSerializers.req
  }),
  bunyan: { // used for logger-related logging
    err: Bunyan.stdSerializers.err,
    process: stdSerializers.process,
    logger: stdSerializers.logger
  }
};

var defSerializer = {
  err: Bunyan.stdSerializers.err
};

/*-------------------------------------------------- Default bodies --------------------------------------------------*/

var bodies = {};

/*================================================ Initialize logger  ================================================*/

var logger = {};

function createLogger(value) {
  if (value != null && typeof value === "object" && value.hasOwnProperty("name")) {
    // add serializers as defined above
    if (serializer.hasOwnProperty(value.name)) {
      value.serializers = serializer[value.name];
    } else {
      Bunyan.logger.bunyan.warn({logger: value}, "no serializers associated. using default serializers");
      value.serializers = defSerializer;
    }

    // create logger
    var log = logger[value.name] = Bunyan.createLogger(value);

    // attach bodies as defined above
    if (bodies.hasOwnProperty(value.name) && !_.isEmpty(bodies[value.name])) {
      log = log.child(bodies[value.name], false, true);
    }

    // make logger available by attaching to bunyan.logger
    Bunyan.logger[value.name] = log;
    if (value.name === "bunyan") {
      cliSetup();
    }
    Bunyan.logger.bunyan.debug({logger: value}, "application logger created");
  }
}

module.exports = function () {
  var lgs = _.clone(prepareLoggerConfig(config.logging.details));

  var idx;
  if (~(idx = _.indexOf(_.pluck(lgs, "name"), "bunyan"))) {
    createLogger(lgs[idx]);
    lgs.splice(idx, 1);
  } else {
    createLogger(prepareLoggerConfig({
      name: "bunyan",
      streams: [
        {
          type: "console",
          level: "debug"
        }
      ]
    }));
  }

  _.each(lgs, createLogger);

  return Bunyan;
};
