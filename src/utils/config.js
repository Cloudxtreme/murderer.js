"use strict";

var LOCAL_FILE_TEST = /\.local\.json$/;
var LOCAL_DIR_TEST = /\.local$/;
var LOCAL_FILE_SIZE = 11;
var LOCAL_DIR_SIZE = 6;

var _ = require("lodash");
var fs = require("fs");
var path = require("path");

function resolveEnv(env, obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj.$noEnv) {
    delete obj.$noEnv;
    return obj;
  }
  if (typeof env !== "string") {
    return obj;
  }
  var o = obj[env];
  while (o !== null && typeof o === "object" && o.hasOwnProperty("$extends")) {
    var ext = o.$extends;
    delete o.$extends;
    if (obj.hasOwnProperty(ext)) {
      o = _.merge(obj[ext], o);
    }
  }
  return o;
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file));
}

/*===================================================== Exports  =====================================================*/

function Config(env) {
  this.$envOrigin = env;
  this.$env = env;
  this.$plain = {};
}

Config.prototype.setEnv = function (env) {
  this.$env = env;
  return this;
};

Config.prototype.resetEnv = function () {
  this.$env = this.$envOrigin;
  return this;
};

Config.prototype.remove = function (key) {
  if (typeof key === "string" && key[0] !== "$") {
    delete this.$plain[key];
    delete this[key];
  }
  return this;
};

Config.prototype.set = function (key, value) {
  if (typeof key === "string" && key[0] !== "$") {
    this[key] = this.$plain[key] = value;
  }
  return this;
};

Config.prototype.extend = function () {
  for (var i = 0; i < arguments.length; i ++) {
    var obj = arguments[i];
    if (typeof obj === "object" && obj !== null) {
      this.$plain = _.merge(this.$plain, resolveEnv(this.$env, obj));
      _.extend(this, this.$plain);
    }
  }
  return this;
};

Config.prototype.extendFile = function (file, fileKey) {
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    var obj = resolveEnv(this.$env, readJSON(file));
    if (fileKey) {
      var key = path.basename(file, LOCAL_FILE_TEST.test(file) ? ".local.json" : ".json");
      if (typeof obj === "object") {
        if (this.$plain[key] == null || typeof this.$plain[key] !== "object") {
          this.$plain[key] = {};
        }
        this[key] = this.$plain[key] = _.merge(this.$plain[key], obj);
      } else {
        this[key] = this.$plain[key] = obj;
      }
    } else if (typeof obj === "object" && obj !== null) {
      _.extend(this, this.$plain = _.merge(this.$plain, obj));
    }
  }
  return this;
};

Config.prototype.extendDir = function (dir, fileKeys, subKeys) {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    extendDir.call(this.$plain, dir, this.$env, fileKeys, subKeys);
    _.extend(this, this.$plain);
  }
  return this;
};

module.exports = Config;

/*================================================= File Operations  =================================================*/

function extendFile(file, env, fileKey) {
  var parent = this; // jshint ignore:line
  var local = LOCAL_FILE_TEST.test(file);
  var base = file.substring(0, file.length - (local ? LOCAL_FILE_SIZE : 5));
  if (local && fs.existsSync(base + ".json") && fs.statSync(base + ".json").isFile()) {
    return;
  }
  var obj = resolveEnv(env, readJSON(file));
  var localObj = null;
  if (!local && fs.existsSync(base + ".local.json") && fs.statSync(base + ".local.json").isFile()) {
    localObj = resolveEnv(env, readJSON(base + ".local.json"));
  }
  if (fileKey) {
    var key = path.basename(file, local ? ".local.json" : ".json");
    if (typeof obj === "object" && obj !== null) {
      if (parent[key] == null || typeof parent[key] !== "object") {
        parent[key] = {};
      }
      parent[key] = _.merge(parent[key], obj);
    }
    if (localObj !== null) {
      parent[key] = _.merge(parent[key], localObj);
    }
  } else {
    var o = parent;
    if (typeof obj === "object" && obj !== null) {
      o = _.merge(o, obj);
    }
    if (localObj !== null) {
      o = _.merge(o, localObj);
    }
    _.extend(parent, o);
  }
}

function extendSubDir(dir, env, fileKeys, subKeys) {
  var parent = this; // jshint ignore:line
  var local = LOCAL_DIR_TEST.test(dir);
  var base = local ? dir.substring(0, dir.length - LOCAL_DIR_SIZE) : dir;
  if (local && fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    return;
  }
  if (subKeys) {
    var key = local ? path.basename(dir, ".local") : path.basename(dir);
    if (parent[key] == null || typeof parent[key] !== "object") {
      parent[key] = {};
    }
    parent = parent[key];
  }
  extendDir.call(parent, dir, env, fileKeys, subKeys);
  if (!local && fs.existsSync(base + ".local") && fs.statSync(base + ".local").isDirectory()) {
    extendDir.call(parent, base + ".local", env, fileKeys, subKeys);
  }
}

function extendDir(dir, env, fileKeys, subKeys) {
  var self = this; // jshint ignore:line
  _.each(fs.readdirSync(dir), function (file) {
    file = path.join(dir, file);
    var stats = fs.statSync(file);
    if (stats.isFile()) {
      extendFile.call(self, file, env, fileKeys);
    } else if (stats.isDirectory()) {
      extendSubDir.call(self, file, env, fileKeys, subKeys);
    }
  });
}
