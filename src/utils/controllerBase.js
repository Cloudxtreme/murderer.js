"use strict";

var _ = require("lodash");
var Q = require("q");

// TODO apply logging to model.model.prototype-functions (save, etc)

var __slice = Array.prototype.slice;

function getModelMethodWrapper(validators, model, key) {
  var modelFn = model[key];
  /**
   * @deprecated
   * Passes validations and forwards additional parameters to associated model method.
   * @param [Object] scope Scope-object containing "log" and "user" (most likely request- or connection-object).
   */
  return function (scope /*...args, callback*/) {
    var args = __slice.call(arguments, 1);
    var childScope = {
      user: scope.user,
      log: scope.log.child({method: key, model: model})
    };
    childScope.log.debug("db-request initiated");
    if (validators.length === 0) {
      // no validators => forward instantly
      childScope.log.debug("db-request no validators");
      modelFn.apply(model, args);
      return;
    }
    // validation required before request gets forwarded
    var callback = args.pop();
    Q
        .all(_.map(validators, function (validator) { return validator.apply(childScope, args); }))
        .done(function () {
          childScope.log.debug("db-request validated");
          args.push(callback);
          modelFn.apply(model, args);
        }, function (err) {
          childScope.log.warn({err: err}, "db-request denied");
          callback(err);
        });
  };
}


function getModelMethodWrapperQ(validators, model, key) {
  var modelFn = Q.nbind(model[key], model);
  /**
   * Passes validations and forwards parameters to associated model method.
   * @param [Object] scope Scope-object containing "log" and "user" (most likely request- or connection-object).
   * @returns Q.Promise Promise to be resolved when model method got resolved.
   */
  return function (scope /*...args*/) {
    var args = __slice.call(arguments, 1);
    var childScope = {
      user: scope.user,
      log: scope.log.child({method: key, model: model})
    };
    childScope.log.debug("db-request initiated");
    if (validators.length === 0) {
      // no validators => forward instantly
      childScope.log.debug("db-request no validators");
      return modelFn.apply(Q, args);
    }
    // validation required before request gets forwarded
    return Q
        .all(_.map(validators, function (validator) { return validator.apply(childScope, args); }))
        .then(function () {
          childScope.log.debug("db-request validated");
          return modelFn.apply(Q, args);
        }, function (err) {
          childScope.log.warn({err: err}, "db-request denied");
          throw err;
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
  var validators = {};

  target.createWrapperCallback = function (key) {
    var v = validators[key] = [];
    target[key] = getModelMethodWrapper(v, model, key);
    target["q" + key[0].toUpperCase() + key.substring(1)] = getModelMethodWrapperQ(v, model, key);
  };

  _.each(model._methods, target.createWrapperCallback);

  target.pre = function (key, handler) {
    schema.pre(key, function (next) { Q.fcall(handler.bind(this), this).then(function () { next(); }, next); });
  };
  target.preParallel = function (key, handler) {
    schema.pre(key, true, function (next, done) {
      var serial = true;
      Q.fcall(handler.bind(this), this).then(function () {
        if (serial) {
          serial = false;
          next();
        }
        done();
      }, done, function () {
        if (serial) {
          serial = false;
          next();
        }
      });
    });
  };
  target.post = schema.post.bind(schema); // TODO pass scope object as context

  /**
   * Allows the controller to register verifier that get called with a logger "log" and the calling user within "this".
   * @param key The function-name to verify queries before forwarding to model.
   * @param cb The verifier. "this" contains "log" and "user". Gets called with callback and query-arguments.
   */
  target.validate = function (key, cb) {
    if (!validators.hasOwnProperty(key)) {
      throw new Error("Attempted to add hook for non-existent method: " + key);
    }
    validators[key].push(cb);
  };

  target.model = model;
  return target;
};
