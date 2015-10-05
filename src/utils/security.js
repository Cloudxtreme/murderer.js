"use strict";

var crypto = require("crypto");
var bcrypt = require("bcrypt");

var config = require("./config").main;

module.exports.encryptPassword = function (password) {
  var pwConfig = config.security.password;
  return bcrypt.hashSync(password, bcrypt.genSaltSync(pwConfig && pwConfig.hashStrength));
};

module.exports.checkPassword = function (candidate, hash) {
  return bcrypt.compareSync(candidate, hash);
};

module.exports.generateToken = function (bytes) {
  return crypto.randomBytes(bytes || config.security.token.bytes).toString("hex");
};

module.exports.generateRandom = function (bytes, encoding) {
  return crypto.randomBytes(bytes).toString(encoding || "hex");
};

module.exports.md5 = function (str) {
  return crypto.createHash("md5").update(str).digest("hex");
};
