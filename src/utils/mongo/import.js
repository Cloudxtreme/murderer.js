"use strict";

var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var async = require("async");
var winston = require("winston");
var spawn = require("child_process").spawn;
var basics = require("./basics");

function importFromFile(uri, collection, file, next) {
  var args = basics.getImportSpawnArguments(uri, collection, file);
  var p = spawn("mongorestore", args);
  p.on("error", winston.err);
  p.on("close", next);
}

/**
 * @param uri The uri of the db to connect to.
 * @param collections Array of collection-names to read or null if dir links to mongodump-directory
 * @param dir The directory or file to import.
 * @param cb The callback.
 */
module.exports.importCollections = function (uri, collections, dir, cb) {
  if (collections) {
    async.parallel(_.map(collections, function (name) {
      return function (next) {
        var file = path.join(dir, name + ".bson");
        fs.exists(file, function (bool) {
          if (bool) {
            importFromFile(uri, name, file, next);
          } else {
            next();
          }
        });
      };
    }), cb);
  } else {
    importFromFile(uri, null, dir, cb);
  }
};
