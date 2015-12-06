"use strict";

var _ = require("lodash");

// TODO apply logging to model.model.prototype-functions (save, etc)

var __slice = Array.prototype.slice;

function getModelCallbackWrapper(validation, model, key) {
  var modelFn = model[key];
  /**
   * 1st parameter: scope-object containing "log" and "user" (most likely request- or connection-object).
   * 2nd... parameter get forwarded to model-function.
   * last parameter: callback.
   */
  return function () {
    var args = __slice.call(arguments);
    var first = args.shift();
    var scope = {
      user: first.user,
      log: first.log.child({method: key, model: model})
    };
    scope.log.debug("db-request initiated");
    var callback = _.last(args);
    var waiting = validation.length;
    if (waiting === 0) {
      // no validation required, forward directly
      scope.log.debug("db-request no validation");
      modelFn.apply(model, args);
      return;
    }
    // validation required before request gets forwarded
    var noError = true;
    var next = function (err) {
      if (err != null) {
        if (noError) {
          noError = false;
          scope.log.warn({err: err}, "db-request denied");
          callback.call(scope, err);
        }
        return;
      }
      if (--waiting === 0) {
        scope.log.debug("db-request validated");
        modelFn.apply(model, args);
      }
    };
    var a = [next];
    a.push.apply(a, args);
    _.each(validation, function (validate) {
      if (noError) {
        validate.apply(scope, a);
      }
    });
  };
}

/**
 * Attaches wrapper-functions of common mongoose-functions to the given object.
 *
 * @param model An object that extends a modelBase.
 * @param target The object to attach the functions.
 */
module.exports = function (model, target) {
  var schema = model.model.schema;
  var validation = {};

  target.createWrapperCallback = function (key) {
    return target[key] = getModelCallbackWrapper(validation[key] = [], model, key);
  };

  _.each(model._methods, target.createWrapperCallback);

  target.pre = function () {
    schema.pre.apply(schema, arguments);
  };
  target.post = function () {
    schema.post.apply(schema, arguments);
  };

  /**
   * Allows the controller to register verifier that get called with a logger "log" and the calling user within "this".
   * @param key The function-name to verify queries before forwarding to model.
   * @param cb The verifier. "this" contains "log" and "user". Gets called with callback and query-arguments.
   */
  target.validate = function (key, cb) {
    if (!validation.hasOwnProperty(key)) {
      throw new Error("Attempted to add hook for non-existent method: " + key);
    }
    validation[key].push(cb);
  };

  target.model = model;
  return target;
};
