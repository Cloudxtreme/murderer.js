"use strict";

var controller = require("../controller");

controller.post("remove", function (user) { controller.qSendMailByKey(this, user, "account.removed"); });
