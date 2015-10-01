"use strict";

var FILE_EXTS = {
  JavaScript: [".js", ".javascript"],
  Less: [".less"]
};

var _ = require("lodash");
var fs = require("fs");
var path = require("path");

var config = require("./config").main;

// To prevent code-duplication the following functions get exported by /server.js:
exports.eachFileRecursive = _.noop; // rootDir, cb
exports.recursiveAbsolutePaths = _.noop; // cwd, object

/**
 * Calls the given callback for each file within the given directory that has a parent-directory called like given
 * dirname.
 * @param dir The root-directory to start searching.
 * @param dirname The name of the parent-directory to filter.
 * @param cb The callback to call once with each file-path.
 */
exports.eachFileWithinDirsRecursive = function (dir, dirname, cb) {
  fs.readdirSync(dir).forEach(function (file) {
    var filename = path.join(dir, file);
    if (file === dirname) {
      exports.eachFileRecursive(filename, cb);
    } else if (fs.statSync(filename).isDirectory()) {
      exports.eachFileWithinDirsRecursive(filename, dirname, cb);
    }
  });
};

exports.matchingFilesRecursive = function (base, regex, cb) {
  fs.exists(base, function (bool) {
    if (!bool) {
      return cb(new Error("No such directory: " + base));
    }
    exports.eachFileRecursive(base, function (filename) {
      if (regex.test(filename)) {
        cb(filename);
      }
    });
  });
};

exports.copy = function (src, dest, cb) {
  var rStream = fs.createReadStream(src);
  rStream.pipe(fs.createWriteStream(dest));
  rStream.on("end", function () {
    cb(null, dest);
  });
  rStream.on("error", function (err) {
    cb(err);
  });
};

exports.relative = function (filename) {
  return path.relative(config.cwd, filename);
};

exports.hasAnyExt = function (filename, exts) {
  return exts.indexOf(path.extname(filename)) >= 0;
};

exports.hasExt = function (filename, ext) {
  return path.extname(filename) === ext;
};

// Create references for IDE-Inspections and ...
exports.isJavaScriptFile = _.noop;
exports.isLessFile = _.noop;
// ... attach such functions.
_.each(FILE_EXTS, function (exts, name) {
  var fn, ext;
  if (exts.length === 0) {
    fn = function () {
      return false;
    };
  } else if (exts.length === 1) {
    ext = exts[0];
    fn = function (filename) {
      return exports.hasExt(filename, ext);
    };
  } else {
    fn = function (filename) {
      return exports.hasAnyExt(filename, exts);
    };
  }
  exports["is" + name + "File"] = fn;
});
