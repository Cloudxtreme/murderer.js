"use strict";

var Q = require("q");

var DEFAULT_ORDER = 1;
var defer = Q.defer, when = Q.when;

/*=================================================== Constructor  ===================================================*/

function Bus() {
  this.$listener = {};
  this.$filter = {};
  this.$deferreds = {};
}

/*================================================= Helper Functions =================================================*/

function getBusObject(obj) {
  if (typeof obj === "function") {
    return {fn: obj, order: DEFAULT_ORDER};
  } else if (typeof obj === "object" && obj != null && typeof obj.callback != null) {
    return {fn: obj.callback, order: obj.hasOwnProperty("order") ? obj.order : DEFAULT_ORDER};
  }
}

function compareOrder(obj1, obj2) { return obj1.order - obj2.order; }

function append(obj, key, val) {
  if (obj.hasOwnProperty(key)) {
    obj[key].push(val);
    obj[key].sort(compareOrder);
  } else {
    obj[key] = [val];
  }
}

/*===================================================== Traffic  =====================================================*/

/*------------------------------------------------------ Events ------------------------------------------------------*/

Bus.prototype.on = function (id, obj) {
  obj = getBusObject(obj);
  if (obj != null) {
    append(this.$listener, id, obj);
  }
  return this;
};

Bus.prototype.emit = function (id, data) {
  if (this.$listener.hasOwnProperty(id)) {
    var _l = this.$listener[id], _len = _l.length;
    for (var i = 0; i < _len; i++) {
      _l[i].fn(data);
    }
  }
  return this;
};

/*------------------------------------------------------ Filter ------------------------------------------------------*/

Bus.prototype.filter = function (id, obj) {
  obj = getBusObject(obj);
  if (obj != null) {
    append(this.$filter, id, obj);
  }
  return this;
};

Bus.prototype.pipe = function (id, data) {
  var promise = when(data);
  if (this.$filter.hasOwnProperty(id)) {
    var _f = this.$filter[id], _len = _f.length;
    for (var i = 0; i < _len; i++) {
      promise = promise.then(_f[i].fn);
    }
  }
  return promise;
};

/*--------------------------------------------- Filter and Events alias  ---------------------------------------------*/

Bus.prototype.trigger = function (id, data) {
  var self = this;
  return this.pipe(id, data).then(function (data) {
    self.emit(id, data);
    return data;
  });
};

/*----------------------------------------------------- Promises -----------------------------------------------------*/

Bus.prototype.when = function (id) {
  if (this.$deferreds.hasOwnProperty(id)) {
    return this.$deferreds[id].promise;
  }
  return (this.$deferreds[id] = defer()).promise;
};

Bus.prototype.defer = function (id) {
  if (this.$deferreds.hasOwnProperty(id)) {
    return this.$deferreds[id];
  }
  return this.$deferreds[id] = defer();
};

/*===================================================== Exports  =====================================================*/

module.exports = Bus;
module.exports.main = new Bus();
