"use strict";

var security = require.main.require("./utils/security");

var controller = require("../controller");

var USERNAME_REGEX = /^[a-zA-Z][\w\d]{2,}$/;

controller.validate("create", function (user) {
  if (!USERNAME_REGEX.test(user.username)) { throw new Error("Username invalid."); }

  if (user.password.length < 4) { throw new Error("Password too short."); }

  if (!user.avatarUrl) {
    user.avatarUrl = "//www.gravatar.com/avatar/" + security.md5(user.email.toLowerCase()) + "?d=identicon";
  }

  user.lastName = user.username;
});

controller.validate("remove", function (filter) {
  var user = this.user;
  if (filter == null || !filter.hasOwnProperty("_id") || typeof filter._id !== "string") {
    throw new Error("User remove only allowed by ID");
  }
  var id = filter._id;
  if (id !== user._id && !user.admin) { throw new Error("You are not allowed to remove this user"); }
});

controller.pre("save", function (user) { user.bio = user.bio != null ? user.bio.substring(0, 256) : ""; });
