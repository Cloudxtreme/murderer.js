"use strict";

var connections = require.main.require("./controller/connections");

var controller = require("../controller");

controller.post("save", function (user) { connections.updateUser(user); });
controller.post("remove", function (user) { connections.removeUser(user._id); });
