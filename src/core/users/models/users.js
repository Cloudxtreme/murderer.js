"use strict";

var COLLECTION_NAME = "User";

var _ = require("lodash");
var mongoose = require("mongoose");

var modelBase = require("../../../utils/modelBase");
var security = require("../../../utils/security");

var Schema = require("mongoose").Schema;

var INTERNAL_VALUES = [
  "cdate", "mdate", "username", "hashedPassword", "admin", "password", "activated", "email", "resetPasswordToken",
  "resetPasswordExpires"
];

/*================================================ Schema Definition  ================================================*/

// TODO somehow disallow filter by pw
var UserSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      mdate: {type: Date, default: Date.now},
      // credentials
      username: {type: String, required: true, unique: true, trim: true},
      hashedPassword: {type: String, default: ""},
      // status-flags
      admin: {type: Boolean, default: false},
      activated: {type: Boolean, default: true},
      // email
      email: {type: String, required: true, unique: true, trim: true, lowercase: true},
      // reset password
      resetPasswordToken: {type: String, default: 0, trim: true},
      resetPasswordExpires: {type: Date, default: 0},
      // misc
      avatarUrl: {type: String, trim: true, lowercase: true}
    }
);

UserSchema
    .virtual("password")
    .set(function (password) {
      this._pw = password;
      this.hashedPassword = security.encryptPassword(password);
    })
    .get(function () {
      return this._pw;
    });

UserSchema.methods.setAdmin = function (admin, cb) {
  this.admin = admin;
  this.save(cb);
};

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, UserSchema);
modelBase(model, module.exports, ["email", "username"]);

module.exports.COLLECTION_NAME = COLLECTION_NAME;
module.exports.INTERNAL_VALUES = INTERNAL_VALUES;

var transportIgnore = ["hashedPassword", "email", "__v", "log"];

module.exports.getTransportCopy = function (user) {
  if (user instanceof Array) {
    return _.map(user, module.exports.getTransportCopy);
  }
  return _.omit(user, transportIgnore);
};

/*---------------------------------------------- Sample user generation ----------------------------------------------*/

var tmpCount = 0;
module.exports.createGuest = function () {
  var id = tmpCount++;
  return {
    _id: "guest/" + id,
    guest: true,
    activated: true,
    username: "guest/" + id
  };
};
module.exports.createAdmin = function () {
  var id = tmpCount++;
  return {
    _id: "admin/" + id,
    admin: true,
    activated: true,
    username: "admin/" + id
  };
};

/*---------------------------------------------- Module classification  ----------------------------------------------*/

module.exports.findByModule = function (name, cb) {
  switch (name) {
    case "admin":
      return model.find({activated: true, admin: true}, cb);
    case "common":
      return model.find({activated: true, admin: false}, cb);
    case "open":
      return model.find({activated: false}, cb);
  }
  cb(new Error("Module unknown"));
};

module.exports.findByModulePermission = function (name, cb) {
  switch (name) {
    case "admin":
      return model.find({activated: true, admin: true}, cb);
    case "common":
      return model.find({}, cb);
    case "open":
      return model.find({activated: false}, cb);
  }
  cb(new Error("Module unknown"));
};

module.exports.belongsToModule = function (user, name) {
  switch (name) {
    case "admin":
      return user.activated && user.admin;
    case "common":
      return user.activated && !user.admin;
    case "open":
      return user.guest && (!user.admin || !user.activated);
  }
  return false;
};

module.exports.isModulePermitted = function (user, name) {
  switch (name) {
    case "admin":
      return user.activated && user.admin;
    case "common":
      return true;
    case "open":
      return !user.admin || !user.activated;
  }
  return false;
};
