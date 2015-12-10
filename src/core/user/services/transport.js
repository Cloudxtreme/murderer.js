"use strict";

var _ = require("lodash");

var omitFields = [
  "__v",
  "cdate",
  "mdate",
  "log",
  "hashedPassword",
  "email",
  "resetPasswordToken",
  "usernameLower",
  "resetPasswordExpires"
];

/*===================================================== Exports  =====================================================*/

exports.createTransport = createTransport;

/*==================================================== Functions  ====================================================*/

function createTransport(user) {
  if (user instanceof Array) { return _.map(user, createTransport); }
  return _.omit(user._doc, omitFields);
}
