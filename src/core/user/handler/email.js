"use strict";

var email = require("../services/email");
var controller = require("../controller");

controller.post("remove", function (user) { email.sendTemplateByKey(this, user, "account.removed"); });
