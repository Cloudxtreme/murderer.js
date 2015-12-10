"use strict";

var model = require("../model");

/*===================================================== Exports  =====================================================*/

exports.findByModule = findByModule;
exports.findByModulePermission = findByModulePermission;
exports.belongsToModule = belongsToModule;
exports.isModulePermitted = isModulePermitted;

/*==================================================== Functions  ====================================================*/

function findByModule(name, cb) {
  switch (name) {
    case "admin":
      return model.find({admin: true, activated: true}, cb);
    case "active":
      return model.find({admin: false, activated: true}, cb);
    case "closed":
      return model.find({activated: false}, cb);
    case "common":
    case "open":
      return cb(null, []);
  }
  cb(new Error("Module unknown"));
}

function findByModulePermission(name, cb) {
  switch (name) {
    case "admin":
      return model.find({admin: true, activated: true}, cb);
    case "active":
      return model.find({activated: true}, cb);
    case "closed":
    case "common":
      return model.find({}, cb);
    case "open":
      return cb(null, []);
  }
  cb(new Error("Module unknown"));
}

function belongsToModule(user, name) {
  switch (name) {
    case "admin":
      return user.admin && user.activated;
    case "active":
      return !user.admin && user.activated;
    case "closed":
      return !user.activated && !user.guest;
    case "common":
      return false;
    case "open":
      return user.guest;
  }
  throw new Error("Module unknown");
}

function isModulePermitted(user, name) {
  switch (name) {
    case "admin":
      return user.admin && user.activated;
    case "active":
      return user.activated;
    case "closed":
      return !user.guest;
    case "common":
      return true;
    case "open":
      return user.guest;
  }
  throw new Error("Module unknown");
}
