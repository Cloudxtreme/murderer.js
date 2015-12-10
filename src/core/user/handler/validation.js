"use strict";

var security = require.main.require("./utils/security");
var config = require.main.require("./utils/config").main;

var controller = require("../controller");

var USERNAME_REGEX = /^[a-z_ 0-9-]{3,}$/;

// TODO except for admin-creation disable possibility to set various fields on create and save

controller.validate("create", function (body) {
  body.usernameLower = body.username.toLowerCase();
  if (!USERNAME_REGEX.test(body.usernameLower)) { throw new Error("Username may not contain special characters."); }

  if (!body.email) { throw new Error("Email required"); }

  if (body.profileMessage && body.profileMessage.length > 256) { throw new Error("Message too long."); }

  if (body.password.length < 4) { throw new Error("Password too short."); }

  if (!body.avatarUrl) {
    // set default avatar
    body.avatarUrl = "//www.gravatar.com/avatar/" + security.md5(body.email.toLowerCase()) + "?d=identicon&s=50";
  }
});

controller.validate("remove", function (next, filter) { // TODO check whether next is a mistake or explain it in comment
  if (filter == null || !filter.hasOwnProperty("_id") || typeof filter._id !== "string") {
    throw new Error("User remove only allowed by ID");
  }
  var id = filter._id;
  if (id !== this.user._id && !this.user.admin) { throw new Error("You are not allowed to remove this user"); }
});

controller.pre("save", function (user) {
  // disallow password-/email-change except for updatePassword-/updateEmail
  if (!user.isNew) {
    if (user.changedPassword && user.changedPassword !== config.security.secret) {
      throw new Error("No permission to change password");
    } else {
      delete user.hashedPassword;
    }
    if (user.changedEmail && user.changedEmail !== config.security.secret) {
      throw new Error("No permission to change email");
    } else {
      delete user.email;
    }
  }
  delete user.changedPassword;
  delete user.changedEmail;
  user.bio = user.bio != null ? user.bio.substring(0, 256) : "";
});
