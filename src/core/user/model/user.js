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
      profileMessage: {type: String, trim: true},
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

var transportIgnore = ["hashedPassword", "email", "resetPasswordToken", "resetPasswordExpires", "__v", "log"];

module.exports.getTransportCopy = function (user) {
  if (user instanceof Array) {
    return _.map(user, module.exports.getTransportCopy);
  }
  return _.omit(user._doc, transportIgnore);
};

/*---------------------------------------------- Sample user generation ----------------------------------------------*/

var tmpCount = 0;
module.exports.createGuest = function () {
  var id = tmpCount++;
  return {
    _id: "guest/" + id,
    guest: true,
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
};

module.exports.findByModulePermission = function (name, cb) {
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
};

module.exports.belongsToModule = function (user, name) {
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
};

module.exports.isModulePermitted = function (user, name) {
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
};
