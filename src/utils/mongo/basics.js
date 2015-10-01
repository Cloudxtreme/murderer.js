"use strict";

var fs = require("fs");
var path = require("path");
var mongoUri = require("mongo-uri");

module.exports.getSpawnArguments = function (uri, collection, filter, out) {
  var uriData = mongoUri.parse(uri);
  var host = uriData.ports[0] ? uriData.hosts[0] + ":" + uriData.ports[0] : uriData.hosts[0];
  var args = ["-h", host, "-d", uriData.database];
  if (uriData.username) {
    args.push("-u", uriData.username, "-p", uriData.password || "");
  }
  if (collection) {
    args.push("-c", collection);
  }
  if (filter) {
    args.push("-q", filter);
  }
  args.push("-o", out || "-");
  return args;
};

module.exports.getImportSpawnArguments = function (uri, collection, file) {
  var uriData = mongoUri.parse(uri);
  var host = uriData.ports[0] ? uriData.hosts[0] + ":" + uriData.ports[0] : uriData.hosts[0];
  var args = ["-h", host, "-d", uriData.database];
  if (uriData.username) {
    args.push("-u", uriData.username, "-p", uriData.password || "");
  }
  if (collection) {
    args.push("-c", collection);
  }
  args.push(file);
  return args;
};

module.exports.saveExportIntoFile = function (readStream, name, options, cb) {
  module.exports.streamIntoFile(readStream, path.join(options.path,
      (options.prefix ? options.prefix + "-" : "") + name + ".bson"), cb);
};

module.exports.streamIntoFile = function (readStream, dest, cb) {
  var writeStream = fs.createWriteStream(dest);
  readStream.pipe(writeStream);
  writeStream.on("error", cb);
  writeStream.on("finish", function () {
    cb();
  });
};
