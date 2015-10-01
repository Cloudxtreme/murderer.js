"use strict";

var RingBuffer = require("../../utils/bunyan/RingBuffer");

module.exports = function (ignored, log) {
  process.on("SIGINT", function () {
    log.info("Received SIGINT.");
    require.main.exports.exit(130);
  });

  process.on("SIGUSR2", function () {
    log.info("received SIGUSR2. flushing all logging-buffers");
    RingBuffer.flushAll({trigger: "SIGUSR2"});
  });
};
