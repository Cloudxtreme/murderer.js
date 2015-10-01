"use strict";

var _ = require("lodash");
var async = require("async");
var winston = require("winston");
var spawn = require("child_process").spawn;
var basics = require("./basics");

function getExportStream(uri, collection, filter) {
  var args = basics.getSpawnArguments(uri, collection, filter);
  var p = spawn("mongodump", args);
  p.on("error", winston.err);
  return p.stdout;
}

function exportIntoDir(uri, collection, filter, out, next) {
  var args = basics.getSpawnArguments(uri, collection, filter, out);
  var p = spawn("mongodump", args);
  p.on("error", winston.err);
  p.on("close", next);
}

/**
 * @param uri The uri of the db to connect to.
 * @param collections \{collection-name: filter}
 * @param saveOptions Options to pass to the saveFn.
 * @param saveFn The function to call with stream, collection-name, options, cb
 * @param cb The callback.
 */
module.exports.exportCollections = function (uri, collections, saveOptions, saveFn, cb) {
  if (collections) {
    async.parallel(_.map(collections, function (filter, name) {
      return function (next) {
        if (saveOptions.out) {
          exportIntoDir(uri, name, filter, saveOptions.out, next);
        } else {
          saveFn(getExportStream(uri, name, filter), name, saveOptions, next);
        }
      };
    }), cb);
  } else {
    if (saveOptions.out) {
      exportIntoDir(uri, null, null, saveOptions.out, cb);
    } else {
      cb("Invalid input. Cannot export all collections via streams.");
    }
  }
};
