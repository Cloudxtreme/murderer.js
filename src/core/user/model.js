"use strict";

var COLLECTION_NAME = "User";

var mongoose = require("mongoose");

var modelBase = require.main.require("./utils/modelBase");
var security = require.main.require("./utils/security");

var Schema = require("mongoose").Schema;

var LOCKED_FIELDS = [
  "cdate", "mdate", "username", "pw", "admin", "password", "activated", "email", "resetPasswordToken",
  "resetPasswordExpires"
];

/*================================================ Schema Definition  ================================================*/

var UserSchema = new Schema(
    {
      cdate: {type: Date, default: Date.now},
      // credentials
      username: {type: String, required: true, unique: true, trim: true},
      pw: {type: String, default: ""},
      // status-flags
      admin: {type: Boolean, default: false},
      author: {type: Boolean, default: false}, // TODO add author module
      activated: {type: Boolean, default: true},
      // email
      email: {type: String, required: true, unique: true, trim: true, lowercase: true},
      // reset password
      resetPasswordToken: {type: String, default: 0, trim: true},
      resetPasswordExpires: {type: Date, default: 0},
      // data used for latest joined game, to be proposed for next one
      lastName: String,
      lastMessage: {type: String, default: "Try hard"},
      // misc
      avatarUrl: {type: String, trim: true, lowercase: true}
    }
);

UserSchema
    .virtual("password")
    .set(function (password) {
      this._pw = password;
      this.pw = security.encryptPassword(password);
    })
    .get(function () { return this._pw; });

/*===================================================== Exports  =====================================================*/

var model = mongoose.model(COLLECTION_NAME, UserSchema);
modelBase(model, exports, ["email", "username"]);

exports.COLLECTION_NAME = COLLECTION_NAME;
exports.LOCKED_FIELDS = LOCKED_FIELDS;
