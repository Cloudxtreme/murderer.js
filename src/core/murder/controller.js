"use strict";

var model = require("./model");
var ctrlBase = require.main.require("./utils/controllerBase");
var socket = require.main.require("./controller/socket");

var populate = require("./services/populate");

/*===================================================== Exports  =====================================================*/

ctrlBase(model, exports);

exports.qNewsBroadcast = newsBroadcast;

/*==================================================== Functions  ====================================================*/

function newsBroadcast() {
  return populate.newsInstance.apply(null, arguments).then(function (instance) {
    socket.broadcastCommonPermitted("game:kill.committed", instance);
  });
}
