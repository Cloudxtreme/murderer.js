"use strict";

var _ = require("lodash");

var MODEL_FUNCTIONS_EXTEND = [
  "count",
  "find",
  "findById", "findOne",
  "findByIdAndRemove", "findOneAndRemove",
  "findByIdAndUpdate", "findOneAndUpdate", // to be used with care, no mongoose-validation/-middleware
  "populate",
  "remove",
  "update" // to be used with care, no mongoose-validation/-middleware
];

var UNIQUE_FUNCTIONS = [
  {prefix: "findBy", fn: "findOne"},
  {prefix: "findBy", suffix: "AndRemove", fn: "findOneAndRemove"},
  {prefix: "findBy", suffix: "AndUpdate", fn: "findOneAndUpdate"},
  {prefix: "exists", fn: "count"},
  {prefix: "removeBy", fn: "remove"},
  {prefix: "updateBy", fn: "update"}
];

var GENERAL_FUNCTIONS = [
  {prefix: "findBy", fn: "find"},
  {prefix: "countBy", fn: "count"},
  {prefix: "removeBy", fn: "remove"},
  {prefix: "updateBy", fn: "update"}
];

function upper(str) {
  return str[0].toUpperCase() + str.substring(1);
}

function getQueryByKey(key) {
  return function (value) {
    var q = {};
    q[key] = value;
    return q;
  };
}

/**
 * Attaches common functions to the given object.
 *
 * @param model The database collection.
 * @param target The object to attach the functions.
 * @param {Array} [uniques] Keys to create findOne-functions for.
 * @param {Array} [keys] Keys to create find-functions for.
 */
module.exports = function (model, target, uniques, keys) {
  var methods = target._methods = [];

  target.create = function (body, cb) {
    var serviceObj = new model(body); // jshint ignore:line
    serviceObj.save(cb);
  };
  methods.push("create");

  _.each(MODEL_FUNCTIONS_EXTEND, function (key) {
    target[key] = function () {
      return model[key].apply(model, arguments);
    };
  });
  methods.push.apply(methods, MODEL_FUNCTIONS_EXTEND);

  var applyFunctionByData = function (key) {
    var lowerKey, upperKey, getQuery;
    if (typeof key === "string") {
      lowerKey = key;
      upperKey = upper(key);
      getQuery = getQueryByKey(key);
    } else {
      var k = Object.keys(key)[0];
      getQuery = getQueryByKey(k);
      lowerKey = key[k];
      upperKey = upper(key[k]);
    }
    return function (data) {
      var modelFn = model[data.fn];
      var fnName = ((data.prefix || "") + (data.prefix ? upperKey : lowerKey) + (data.suffix || ""));
      if (typeof target[fnName] !== "function") {
        target[fnName] = function (value) {
          arguments[0] = getQuery(value);
          modelFn.apply(model, arguments);
        };
        methods.push(fnName);
      }
    };
  };

  _.each(UNIQUE_FUNCTIONS, applyFunctionByData({_id: "id"}));
  _.each(uniques, function (key) {
    _.each(UNIQUE_FUNCTIONS, applyFunctionByData(key));
  });
  _.each(keys, function (key) {
    _.each(GENERAL_FUNCTIONS, applyFunctionByData(key));
  });

  target.model = model;
  return target;
};
