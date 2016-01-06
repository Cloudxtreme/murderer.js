"use strict";

/*
 * Hard-coded cli-parameters:
 *   -t | --test           Stop after server-start.
 *   -i | --instant-exit   No exit-delay to flush open steams.
 */

var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var assert = require("assert");

/*================================================ Utility Functions  ================================================*/
/*--------------------- Those Functions get appended to utils later to prevent code-duplication  ---------------------*/

/**
 * Calls the given callback for each file within the given directory.
 * @param dir The root-directory.
 * @param cb The callback to call with each filename.
 */
function eachFileRecursive(dir, cb) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function (file) {
      var filename = path.join(dir, file);
      if (fs.statSync(filename).isDirectory()) {
        eachFileRecursive(filename, cb);
      } else {
        cb(filename);
      }
    });
  }
}

/**
 * Prefixes each string-value within (deep) given object with the given cwd.
 * @param cwd The current working directory to prepend (via path.join).
 * @param obj The object to search for string-values.
 * @returns {*} A clone of the given object with replaced string-values.
 */
function recursiveAbsolutePaths(cwd, obj) {
  var type = typeof obj;
  if (type === "string") {
    return path.join(cwd, obj);
  } else if (type === "object") {
    if (obj instanceof Array) {
      return _.map(obj, function (val) { return recursiveAbsolutePaths(cwd, val); });
    } else {
      return _.reduce(obj, function (res, val, key) {
        res[key] = recursiveAbsolutePaths(cwd, val);
        return res;
      }, {});
    }
  }
  return obj;
}

/**
 * Returns the camelCase representation of the given string.
 * @param str The string to convert.
 * @param [firstUpper] Whether to turn the first letter to UpperCase (default: false)
 * @returns {string}
 */
function camelCase(str, firstUpper) {
  str = (firstUpper ? str[0].toUpperCase() : str[0].toLowerCase()) + str.substring(1);
  return str.replace(/[^a-zA-Z]+([a-zA-Z])/g, function (m) {
    return m[m.length - 1].toUpperCase();
  });
}

/*============================================= Initialize the Settings  =============================================*/

var configDir, cwd, lib;

/*----------------------------------------------- Read settings files  -----------------------------------------------*/

var processArgs = process.argv.splice(2);

var parameters = {
  config: function (val) { configDir = val; },
  cwd: function (val) { cwd = val; },
  lib: function (val) { lib = val; }
};

var params = {};
var flags = {};

_.each(processArgs, function (arg) {
  if (arg.substring(0, 2) === "--") {
    var value, key;
    if (~arg.indexOf("=")) {
      var parts = arg.substring(2).split("=");
      key = parts.shift();
      value = parts.join("=");
      if (parameters.hasOwnProperty(key)) {
        parameters[key](value);
      }
    } else {
      key = arg.substring(2);
      value = true;
    }
    params[camelCase(key)] = value;
  } else if (arg[0] === "-") {
    for (var i = 1; i < arg.length; i++) {
      flags[arg[i]] = true;
    }
  }
});

if (!cwd) {
  cwd = path.join(__dirname, "../");
}
if (!lib) {
  lib = path.join(cwd, "src/");
}
if (!configDir) {
  configDir = path.join(cwd, "config");
}

params._noEnv = true;
flags._noEnv = true;

var cfg = {
  args: params,
  flags: flags
};
var pkg = require(path.join(cwd, "package.json"));

// Load settings from filesystem
eachFileRecursive(configDir, function (filename) {
  // skip .local.json files
  if (!/\.local\.json$/.test(filename)) {
    var basename = path.basename(filename, ".json");
    var customName = basename + ".local.json";
    var c = cfg[camelCase(basename)] = require(filename);
    if (fs.existsSync(customName)) {
      // if same filename with .local.json exists, extend that
      _.merge(c, require(customName));
    }
  }
});

if (cfg.environments == null) {
  cfg.environments = {all: ["dist", "dev"], envVariable: null};
}

/*------------------------------------ Determine Environment to use its settings  ------------------------------------*/

var defEnvironment = cfg.environments.default || cfg.environments.all[0], envEnvironment = null, flagEnvironment = null;

// determine whether any environment-flag has been set
_.each(cfg.environments.flags, function (e, flag) {
  if (flags[flag]) {
    flagEnvironment = e;
  }
});
_.each(cfg.environments.env, function (e, env) {
  if (params[env]) {
    flagEnvironment = e;
  }
});

var envVar = cfg.environments.envVariable;
if (envVar !== false) {
  // determine whether the environment-variable (defaults to PKGNAME_ENV) is set to any valid environment
  envVar = typeof envVar === "string" ? envVar : pkg.name.replace(/\W/, "").toUpperCase() + "_ENV";
  var envEnv = process.env[envVar];
  if (envEnv) {
    if (_.contains(cfg.environments.all, envEnv)) {
      envEnvironment = envEnv;
    }
    _.each(cfg.environments.env, function (value, key) {
      if (key.toLowerCase() === envEnv.toLowerCase()) {
        envEnvironment = value;
      }
    });
  }
}

var env = flagEnvironment || envEnvironment || defEnvironment;

assert.ok(env, "Environment expected to be determined.");

var cfgEnv = {};
// load settings of given environment
_.each(cfg, function (value, key) {
  if (value._noEnv) {
    delete value._noEnv;
    cfgEnv[key] = value;
  } else {
    var c = value[env];
    while (c._extend) {
      var k = c._extend;
      delete c._extend;
      c = _.extend({}, value[k], c);
    }
    cfgEnv[key] = c;
  }
});

cfg = cfgEnv;

/*------------------------- Read environment-variables as specified within cfg.envVariables  -------------------------*/

var keyAttr = "_key", defAttr = "_default", typeAttr = "_type";

function getEnvVariablePart(prefix, obj, key) {
  var suffix = !obj.hasOwnProperty(keyAttr) || obj[keyAttr] === true ? key : obj[keyAttr] || "";
  return prefix + (prefix && suffix ? "_" : "") + suffix.toUpperCase();
}

function processEnvVariableValue(target, key, obj, value) {
  var valid = value != null;
  switch (obj[typeAttr] || "string") {
    case "number":
      value = +value;
      valid = !_.isNaN(value);
      break;
    case "object":
      try {
        //noinspection JSUnresolvedVariable
        value = JSON.parse(value);
        valid = true;
      } catch (e) {
        value = null;
        valid = false;
      }
      break;
    case "boolean":
      if (valid) {
        value = value.toLowerCase();
        valid = _.contains(["true", "false", "t", "f", "0", "1"], value);
        value = valid && value === "true" || value === "t" || value === "1";
      }
      break;
    default: // string
      if (!valid) {
        value = "";
      }
  }
  if (valid) {
    target[key] = value;
  } else if (!target.hasOwnProperty(key)) {
    target[key] = obj[defAttr] != null ? obj[defAttr] : value;
  }
}

function checkMapping(prefix, mapping, target) {
  _.each(mapping, function (obj, key) {
    if (obj == null) {
      obj = {};
    } else if (typeof obj === "string") {
      var str = obj;
      obj = {};
      obj[defAttr] = str;
    } else if (typeof obj !== "object") {
      return;
    }
    var subPrefix = getEnvVariablePart(prefix, obj, key);
    var isEmpty = _.isEmpty(obj) || (_.keys(obj).length === 1 && obj.hasOwnProperty(keyAttr));
    if (isEmpty || obj.hasOwnProperty(typeAttr) || obj.hasOwnProperty(defAttr)) {
      processEnvVariableValue(target, key, obj, process.env[subPrefix]);
    } else {
      if (!target.hasOwnProperty(key)) {
        target[key] = {};
      }
      checkMapping(subPrefix, obj, target[key]);
    }
  });
}

if (cfg.envVariables == null) {
  cfg.envVariables = {};
}

checkMapping(getEnvVariablePart("", cfg.envVariables, pkg.name.replace(/\W/, "")), cfg.envVariables, cfg);

/*------------------------------------------------ Tidy the config up ------------------------------------------------*/

delete cfg.envVariables;
delete cfg.environments;

/*--------------------------------------- Validate some required configuration ---------------------------------------*/

function checkAttributes(obj, key, array, name) {
  if (name == null) {
    name = key;
  }
  var parts = key.split(".");
  for (var i = 0; i < parts.length; i++) {
    var k = parts[i];
    if (!obj.hasOwnProperty(k)) {
      obj = null;
      break;
    }
    obj = obj[k];
  }
  assert.ok(typeof obj === "object" && obj != null, "'" + name + "' config expected to be an object");
  var missing = _.filter(array, function (key) {
    return !obj.hasOwnProperty(key);
  });
  assert.ok(!missing.length,
      "Expected '" + name + "' configuration to contain at least ['" + array.join("', '") + "']. " +
      "Missing attributes: ['" + missing.join("', '") + "'].");
}

checkAttributes(cfg, "modules", ["all"]);
checkAttributes(cfg, "paths", ["frontend"]);
checkAttributes(cfg, "logging", ["details"]);
checkAttributes(cfg, "mails.account", ["removed", "passwordResetRequest", "passwordReset"]);
checkAttributes(cfg, "security.session", ["expires"]);
checkAttributes(cfg, "security.token", ["bytes", "expires"]);
checkAttributes(cfg, "security.password", ["hashStrength"]);

/*------------------------------------------- Add some more data to config -------------------------------------------*/

if (cfg.server == null) {
  cfg.server = {};
}

cfg.paths = recursiveAbsolutePaths(cwd, cfg.paths);

cfg.env = env;
cfg.pkg = pkg;
cfg.cwd = cfg.paths.root = cwd;
cfg.lib = cfg.paths.backend = lib;

/*-------------------------------------------------- Apply Settings --------------------------------------------------*/

var Config = require(path.join(cfg.lib, "utils", "config"));
var config = Config.main = new Config(env);
cfg.$noEnv = true;
config.extend(cfg);

/*============================================= Append utility-functions =============================================*/

config.camelCase = camelCase;

var files = require(path.join(cfg.lib, "utils", "files"));
files.eachFileRecursive = eachFileRecursive;
files.recursiveAbsolutePaths = recursiveAbsolutePaths;

/*============================================== Setup Logging Streams  ==============================================*/

var bunyan = require("./setup/bunyan")();

/*============================================== Ensure clean shutdown  ==============================================*/

var clean = false;

module.exports.shutdown = module.exports.exit = function (code) {
  clean = module.exports.shutdownInitiated = true;
  try {
    bunyan.logger.app.info({exitCode: code}, "Shutdown initiated... Waiting for streams to close.");
  } catch (e) {
    console.error(e);
    console.log("Shutdown [" + code + "] initiated. Waiting for streams to close.");
  }
  try {
    bunyan.shutdown();
  } catch (e) {
    console.error(e);
  }
  //noinspection JSUnresolvedVariable
  if (config.flags.t || config.args.test || config.flags.i || config.args.instantExit) {
    process.exit(code);
  } else {
    // TODO waiting for streams would be great. not possible though.
    // Problem: bunyan-bin for console-output is child-process
    //          => it gets killed once process.exit gets called.
    //          => pipelined content doesn't arrive or if it does child doesn't have processing-time.
    setTimeout(function () {
      process.exit(code);
    }, 250);
  }
};

process.on("exit", function (code) {
  if (!clean) {
    try {
      bunyan.logger.app.fatal({exitCode: code}, "Unexpected shutdown");
    } catch (e) {
    }
    console.error("Unexpected shutdown. [" + code + "]");
  }
});

/*============================================ Call further server-setup  ============================================*/

var setupServer = require(path.join(cfg.lib, "server"));
setupServer();

// TODO export method requireCore(relativeKey)
