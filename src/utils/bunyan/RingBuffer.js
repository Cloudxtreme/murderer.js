"use strict";

var _ = require("lodash");
var os = require("os");
var bunyan = require("bunyan");

var config = require("../config").main;

var DEFAULT_LIMIT = 50;
var NOTICE_LEVEL = bunyan.TRACE;
var dev = config.server.development;

var runningBuffers = [];

/**
 * RingBuffer is a writable Stream that just stores the last N records in memory and forwards to child-streams when a
 * message beats the threshold-level.
 * @param {Object} [options] may contain the following fields:
 *   <ul>
 *     <li><code>name</code> [String] logger-identifier </li>
 *     <li><code>limit</code> [Number] amount of logs to keep in cache-queue</li>
 *     <li><code>threshold</code> [String|Number] logging-level to trigger flushing the logs</li>
 *     <li>
 *       <code>replicate</code> [Boolean|Number] default: false.
 *         boolean: whether to replicate for logger-children.
 *         number: depth until replication for logger-children gets stopped.
 *     </li>
 *     <li><code>cleanOnFlush</code> [Boolean] whether to reset queue after messages got flushed</li>
 *     <li><code>flushOnEnd</code> [Boolean] whether to flush queue when buffer gets closed</li>
 *     <li><code>streams</code> [Array] the child-streams to flush messages to</li>
 *     <li><code>stream</code> [Object] the child-stream to flush messages to (gets added to <code>streams</code>)</li>
 *   </ul>
 * @param {Boolean} [child] if true the given streams are assumed to be well-formatted
 * @param {Logger} [logger] The logger this buffer gets applied to. Optionally needed when flushing without cached logs.
 * @constructor
 */
function RingBuffer(options, child, logger) {
  if (child != null && typeof child !== "boolean") {
    logger = child;
    child = false;
  }
  if (options === null || typeof options !== "object") {
    options = {};
  }
  this.logger = logger;
  this._options = _.omit(options, ["stream", "path"]);
  this.records = [];
  this.lost = 0;

  this.name = options.name || "buffer";
  this.limit = typeof options.limit === "number" ? options.limit : DEFAULT_LIMIT;
  this.replicate = options.replicate == null ? false : options.replicate;
  this.cleanOnFlush = (options.clean !== false);
  this.flushOnEnd = options.flush;
  var streams = options.streams || [];
  if (options.stream) {
    streams.push({
      type: "stream",
      stream: options.stream,
      level: 0
    });
  }
  if (options.path) {
    streams.push({
      type: "file",
      path: options.path,
      level: 0
    });
  }
  if (child) {
    this.streams = streams;
  } else {
    this.streams = [];
    var self = this;
    _.each(streams, function (s) {
      bunyan.prototype.addStream.call(self, s, 0);
    });
  }
  this._options.streams = this.streams;
  switch (typeof options.threshold) {
    case "number":
      this.trigger = options.threshold;
      break;
    case "string":
      this.trigger = bunyan.levelFromName[options.threshold.toLowerCase()];
      break;
    default:
      this.trigger = bunyan.WARN;
  }
  if (this.flushOnEnd || dev) {
    runningBuffers.push(this);
  }
}

RingBuffer.prototype.emit = _.noop;

/**
 * Creates a new RingBuffer with equal options.
 * If the replication-depth of this instance is limited this may return the instance itself.
 * @param {Logger} [logger] The logger this child gets applied to. Optionally needed when flushing without cached logs.
 * @returns {RingBuffer} The new RingBuffer or this instance.
 */
RingBuffer.prototype.child = function (logger) {
  // don't replicate if replication-depth is exceeded
  if (this.replicate === false || this.replicate <= 0) {
    this.shared = true;
    return this;
  }
  // replicate with increased depth
  var rb = new (this.constructor)(this._options, true, logger || this.logger);
  rb.replicate = typeof this.replicate === "number" ? this.replicate - 1 : this.replicate;
  return rb;
};

/**
 * Creates a bunyan-like object that contains a message about the lost-status of cache.
 * @param {Object} [body] Data that will get extended to the logging-object.
 * @returns {String} The stringified object containing the message.
 */
RingBuffer.prototype.getFlushMessage = function (body) {
  var first = this.records[0];
  if (this.records.length === 0) {
    first = {
      name: this.logger.fields.name || "buffer",
      hostname: this.logger.fields.hostname || os.hostname(),
      pid: this.logger.fields.pid || process.pid,
      time: new Date().toISOString(),
      v: this.logger.fields.v || 0
    };
  } else if (typeof first === "string") {
    first = JSON.parse(first);
  }
  return JSON.stringify(_.extend(_.pick(first, ["name", "hostname", "pid", "time", "v"]), body, {
        level: NOTICE_LEVEL,
        limit: this.limit,
        traced: this.lost + this.records.length,
        cached: this.records.length,
        lost: this.lost,
        msg: "flushing ring-buffer"
      })) + os.EOL;
};

/**
 * Plain write-function to send the given string to all streams.
 * @param msg The string to send.
 */
RingBuffer.prototype.writeStreams = function (msg) {
  _.each(this.streams, function (stream) {
    stream.stream.write(msg);
  });
};

/**
 * Logs all queued records into associated streams.
 * @param {Object} [body] Gets extended to the logging-object.
 */
RingBuffer.prototype.flush = function (body) {
  var self = this;
  this.writeStreams(this.getFlushMessage(body));

  _.each(self.records, function (record, idx) {
    if (typeof record !== "string") {
      record = self.records[idx] = JSON.stringify(record) + os.EOL;
    }
    self.writeStreams(record);
  });

  if (this.cleanOnFlush) {
    this.records = [];
    this.lost = 0;
  }
};

/**
 * Pushes the given record into records-queue.
 * @param record The object to cache.
 */
RingBuffer.prototype.write = function (record) {
  this.records.push(record);

  if (this.records.length > this.limit) {
    this.records.shift();
    this.lost++;
  }

  if (record.level >= this.trigger) {
    this.flush({trigger: "threshold exceeded"});
  }
};

/**
 * May flush remaining cache. Tidies up reference to this buffer.
 * @param {Boolean} [flush] if true {@link #flush} gets called first. default: as set within constructor-options.
 * @param {Object} [body] Gets extended to the logging-object if it flushes.
 */
RingBuffer.prototype.end = function (flush, body) {
  if (this.ended) {
    return;
  }
  this.ended = true;
  if (flush || flush == null && this.flushOnEnd) {
    this.flush(body || {trigger: "source ended"});
  }
  // remove reference out of running buffers
  var idx = _.indexOf(runningBuffers, this);
  if (~idx) {
    runningBuffers.splice(idx, 1);
  }
};

/**
 * End if this instance doesn't get used by multiple loggers.
 * @param {Boolean} [flush] if true {@link #flush} gets called first. default: as set within constructor-options.
 */
RingBuffer.prototype.done = function (flush) {
  if (!this.shared) {
    this.end(flush);
  }
};

module.exports = RingBuffer;
module.exports.running = runningBuffers;

/**
 * Flushes all running buffers.
 * @param {Object} [body] Gets extended to the logging-object.
 */
module.exports.flushAll = function (body) {
  _.each(runningBuffers, function (buffer) {
    buffer.flush(body);
  });
};

/**
 * End all running buffers.
 * Should only get called before server-shutdown.
 * @param {Object} [body] Gets extended to the logging-object if it flushes.
 */
module.exports.shutdown = function (body) {
  _.each(_.clone(runningBuffers), function (buffer) {
    buffer.end(null, body);
  });
};
